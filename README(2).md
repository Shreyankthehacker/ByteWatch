# ByteWatch

ByteWatch is a backend-focused video-on-demand (VOD) streaming platform
built with **Java, Spring Boot, PostgreSQL, FFmpeg, HLS, and JWT-based
authentication**.

The project is designed to go beyond simply uploading and returning an
MP4 file. It implements the core pipeline used by modern video
platforms:

**Upload → Store → Process → Transcode → Segment → Serve → Stream**

The current implementation focuses on building the backend and
understanding the engineering decisions behind video storage,
asynchronous processing, authentication, and adaptive HTTP streaming.

------------------------------------------------------------------------

## Architecture

``` text
                         ┌──────────────────────┐
                         │       Client         │
                         │ React / HLS.js       │
                         └──────────┬───────────┘
                                    │
                              REST / HTTP
                                    │
                         ┌──────────▼───────────┐
                         │     Spring Boot      │
                         │      Backend         │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
       │ PostgreSQL  │       │ Local Video │       │ Spring       │
       │  Metadata   │       │   Storage   │       │ Security/JWT │
       └─────────────┘       └──────┬──────┘       └──────────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │  FFmpeg   │
                              │ Transcoder│
                              └─────┬─────┘
                                    │
                         ┌──────────▼──────────┐
                         │        HLS          │
                         │ .m3u8 + .ts chunks  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                               HLS.js Player
```

------------------------------------------------------------------------

## Core Features

### 1. User Authentication

ByteWatch uses Spring Security with JWT authentication.

The authentication flow is stateless:

``` text
Login
  ↓
Credentials validated
  ↓
JWT generated
  ↓
Client sends JWT with requests
  ↓
JwtAuthenticationFilter
  ↓
SecurityContext
  ↓
Protected controller
```

Authentication-related components include:

-   `AuthController`
-   `AuthService`
-   `JwtService`
-   `JwtAuthenticationFilter`
-   `CustomUserDetailService`
-   BCrypt password encoding
-   `AuthenticationManager`

------------------------------------------------------------------------

### 2. Video Upload

A video is uploaded through a multipart REST request.

The backend separates:

-   video metadata
-   physical file storage
-   video processing

This keeps the business layer independent from the storage
implementation.

A simplified flow is:

``` text
POST /api/videos
       ↓
Create Video metadata
       ↓
Save original file
       ↓
Create video directory
       ↓
Mark video as PROCESSING
       ↓
Start FFmpeg processing asynchronously
```

------------------------------------------------------------------------

## Video Processing Pipeline

The most important part of ByteWatch is the processing pipeline.

An uploaded video is not immediately streamed as the original MP4.

Instead:

``` text
Original Video
      │
      ▼
   FFmpeg
      │
      ├── 1080p
      ├── 720p
      ├── 480p
      └── 360p
            │
            ▼
       HLS Packaging
            │
            ├── playlist.m3u8
            ├── segment001.ts
            ├── segment002.ts
            ├── segment003.ts
            └── ...
```

HLS works by splitting the media into smaller HTTP-delivered segments.
The player reads the playlist and requests segments as needed.

This makes adaptive playback possible and avoids treating the entire
video as one huge HTTP object.

------------------------------------------------------------------------

## Video Status Lifecycle

Each video has a processing state:

``` text
UPLOADING
    │
    ▼
PROCESSING
    │
    ├──────────────► FAILED
    │
    ▼
READY
```

The status allows the application to distinguish between:

-   an upload that is still happening
-   a video being transcoded
-   a successfully processed video
-   a failed processing job

A user should only be allowed to play a video once its state becomes
`READY`.

------------------------------------------------------------------------

## Asynchronous FFmpeg Processing

FFmpeg transcoding is CPU-intensive and should not block the HTTP
request.

ByteWatch uses Spring's asynchronous execution model with a dedicated
executor.

Conceptually:

``` text
HTTP Request
     │
     ├── Save metadata
     ├── Save original file
     └── Submit processing job
              │
              ▼
       Video Task Executor
              │
              ▼
            FFmpeg
              │
              ▼
          HLS output
```

The API can therefore return after the upload/storage phase instead of
keeping the HTTP connection open while multiple resolutions are
generated.

The current executor is intentionally small during development:

-   Core threads: 2
-   Maximum threads: 2
-   Queue capacity: 10

For production, this would need to be replaced with a more robust
job-processing architecture.

------------------------------------------------------------------------

## Storage Layout

The current implementation uses local filesystem storage.

A typical video directory looks like:

``` text
storage/
└── videos/
    └── 3/
        ├── original.mp4
        └── hls/
            ├── 1080p/
            │   ├── playlist.m3u8
            │   ├── segment001.ts
            │   ├── segment002.ts
            │   └── ...
            │
            ├── 720p/
            │   ├── playlist.m3u8
            │   ├── segment001.ts
            │   └── ...
            │
            ├── 480p/
            │   ├── playlist.m3u8
            │   └── ...
            │
            └── 360p/
                ├── playlist.m3u8
                └── ...
```

The database stores metadata and paths, while the actual media remains
in filesystem storage.

The current configuration uses:

``` properties
video.storage.path=./storage/videos
```

------------------------------------------------------------------------

## HLS Streaming

ByteWatch exposes HLS resources through Spring Boot.

Typical endpoints:

``` text
GET /{videoId}/hls/master.m3u8

GET /{videoId}/hls/{quality}/playlist.m3u8

GET /{videoId}/hls/{quality}/{segment}.ts
```

The master playlist can describe the available quality variants.

For example:

``` text
master.m3u8
      │
      ├── 1080p/playlist.m3u8
      ├── 720p/playlist.m3u8
      ├── 480p/playlist.m3u8
      └── 360p/playlist.m3u8
```

The player can then select an appropriate variant based on available
bandwidth and playback conditions.

------------------------------------------------------------------------

## Adaptive Bitrate Streaming

The goal is not simply to have multiple resolutions.

The important idea is that the client can switch between
representations.

For example:

``` text
Good Network
     │
     ▼
  1080p

Network degrades
     │
     ▼
   720p

Network degrades further
     │
     ▼
   480p
```

This is one of the key differences between a basic video download
endpoint and a proper adaptive streaming pipeline.

The frontend can use `hls.js` to consume the generated HLS manifests.

------------------------------------------------------------------------

## FFmpeg

FFmpeg is responsible for video transcoding and HLS packaging.

A simplified processing command is conceptually:

``` text
ffmpeg
  -i input.mp4
  -c:v libx264
  -c:a aac
  -vf scale=-2:720
  -b:v 2500k
  -b:a 128k
  -f hls
  playlist.m3u8
```

The same pipeline can be applied to multiple quality profiles.

FFmpeg therefore becomes the media-processing engine while Spring Boot
acts as the application and orchestration layer.

------------------------------------------------------------------------

## Backend Package Structure

The backend is organized around responsibilities rather than putting
everything inside controllers.

``` text
com.bytewatch
│
├── auth
│   ├── controller
│   ├── service
│   ├── security
│   └── ...
│
├── user
│   ├── controller
│   ├── entity
│   ├── repository
│   └── ...
│
└── video
    ├── controller
    │   ├── VideoController
    │   └── VideoPlayerController
    │
    ├── entity
    │   ├── Video
    │   └── VideoStatus
    │
    ├── repository
    │   └── VideoRepository
    │
    └── service
        ├── VideoService
        ├── VideoStorageService
        └── FfmpegService
```

The separation is intentional:

### `VideoController`

Handles application-level video APIs such as upload and metadata
operations.

### `VideoService`

Contains video business logic.

### `VideoStorageService`

Handles filesystem operations.

### `FfmpegService`

Handles interaction with FFmpeg.

### `VideoPlayerController`

Handles serving HLS manifests and media segments.

This prevents the controller from becoming responsible for storage,
processing, authentication, and streaming at the same time.

------------------------------------------------------------------------

## Database Model

The `Video` entity represents the logical video rather than the physical
media itself.

Typical metadata includes:

``` text
id
title
description
storagePath
visibility
status
contentType
createdAt
user
```

The important architectural distinction is:

``` text
Database
   │
   ├── What is this video?
   ├── Who owns it?
   ├── Is it public?
   ├── Is processing complete?
   └── Where is it stored?

Filesystem
   │
   ├── Original video
   ├── HLS manifests
   └── HLS segments
```

This allows the storage implementation to evolve later without
redesigning the entire domain model.

------------------------------------------------------------------------

## Security

ByteWatch uses stateless JWT authentication.

Protected requests follow:

``` text
Client
  │
  │ Authorization: Bearer <JWT>
  ▼
JwtAuthenticationFilter
  │
  ▼
Validate token
  │
  ▼
Load user
  │
  ▼
Set Authentication
  │
  ▼
Controller
```

Spring Security is configured without:

-   form login
-   HTTP basic authentication
-   server-side sessions

The application therefore follows a stateless API model.

------------------------------------------------------------------------

## Current Technology Stack

### Backend

-   Java 17
-   Spring Boot
-   Spring MVC
-   Spring Security
-   Spring Data JPA
-   Hibernate
-   Maven
-   Lombok

### Database

-   PostgreSQL

### Authentication

-   JWT
-   BCrypt
-   Spring Security

### Media Processing

-   FFmpeg
-   HLS
-   H.264
-   AAC

### Frontend / Playback

-   React
-   React Router
-   Zustand
-   hls.js

### Development

-   Git
-   Linux
-   Docker
-   REST APIs

------------------------------------------------------------------------

## API Overview

### Authentication

``` text
POST /auth/login
```

Returns a JWT after successful authentication.

------------------------------------------------------------------------

### Users

``` text
GET    /api/users/get-all-users
GET    /api/users/get-user/{id}
POST   /api/users/create-users
DELETE /api/users/delete-users/{id}
```

------------------------------------------------------------------------

### Videos

The video API is responsible for uploading and managing video metadata.

Example conceptual endpoint:

``` text
POST /api/videos
```

The request contains the video as a multipart file along with its
metadata.

------------------------------------------------------------------------

### HLS Playback

``` text
GET /{videoId}/hls/master.m3u8

GET /{videoId}/hls/{quality}/playlist.m3u8

GET /{videoId}/hls/{quality}/{segment}.ts
```

------------------------------------------------------------------------

## Local Development

### Requirements

Install:

-   Java 17
-   Maven
-   PostgreSQL
-   FFmpeg

Verify FFmpeg:

``` bash
ffmpeg -version
```

Verify Java:

``` bash
java -version
```

------------------------------------------------------------------------

## Configuration

Example:

``` properties
video.storage.path=./storage/videos
ffmpeg.path=/usr/bin/ffmpeg
```

Update the PostgreSQL configuration according to your local environment.

------------------------------------------------------------------------

## Running the Backend

Build:

``` bash
./mvnw clean package
```

Run:

``` bash
./mvnw spring-boot:run
```

Or run the generated JAR:

``` bash
java -jar target/bytewatch.jar
```

------------------------------------------------------------------------

## Upload-to-Playback Flow

The complete flow is:

``` text
1. User uploads video
        ↓
2. Spring Boot receives MultipartFile
        ↓
3. Video metadata saved to PostgreSQL
        ↓
4. Original file saved to storage/videos/{id}
        ↓
5. Video status = PROCESSING
        ↓
6. Background task starts
        ↓
7. FFmpeg generates multiple resolutions
        ↓
8. HLS playlists and segments are created
        ↓
9. Processing succeeds
        ↓
10. Video status = READY
        ↓
11. Client requests master.m3u8
        ↓
12. HLS player reads variant playlist
        ↓
13. Player requests .ts segments
        ↓
14. Video starts playing
```

------------------------------------------------------------------------

## Why HLS Instead of Returning MP4?

A simple implementation could expose:

``` text
GET /videos/3/video.mp4
```

but that would make the server deliver one large media object.

HLS instead turns the video into a manifest plus smaller media segments.

That gives the streaming layer:

-   adaptive quality
-   efficient seeking
-   incremental downloads
-   better buffering behavior
-   multiple bitrate representations
-   a clean separation between media processing and playback

HLS is therefore a much better foundation for a streaming platform than
simply returning the original MP4.

------------------------------------------------------------------------

## Important Engineering Decisions

### Local storage first

The project intentionally starts with local filesystem storage.

This makes it easier to understand the complete pipeline before
introducing cloud infrastructure.

Later:

``` text
Local filesystem
      ↓
Object storage
      ↓
S3
      ↓
CDN
```

The storage abstraction should make this migration possible without
rewriting the video domain.

------------------------------------------------------------------------

### Synchronous vs asynchronous processing

FFmpeg should not execute directly inside the HTTP request lifecycle.

Bad:

``` text
POST /upload
     ↓
Upload
     ↓
FFmpeg for several minutes
     ↓
HTTP response
```

Better:

``` text
POST /upload
     ↓
Save video
     ↓
Queue processing
     ↓
HTTP response

Background worker
     ↓
FFmpeg
     ↓
READY
```

------------------------------------------------------------------------



---

## Planned Microservice Architecture

The current ByteWatch implementation is intentionally a **modular monolith**. The next major evolution will be to split the system into independently deployable services.

The migration will be incremental rather than an immediate rewrite.

### Target Architecture

```text
                         ┌──────────────────┐
                         │      Client      │
                         │ React + HLS.js   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   API Gateway    │
                         │ Routing / Auth   │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
      ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
      │ Auth Service │    │ Video Service │    │ User Service │
      │              │    │              │    │              │
      │ JWT / Users  │    │ Metadata     │    │ Profiles     │
      │ Security     │    │ Uploads      │    │ Preferences  │
      └──────────────┘    └──────┬───────┘    └──────────────┘
                                 │
                                 ▼
                         ┌──────────────────┐
                         │   Message Queue  │
                         │ Kafka / RabbitMQ │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │ Transcoder │ │ Transcoder │ │ Transcoder │
             │  Worker 1  │ │  Worker 2  │ │  Worker N  │
             └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  ▼
                         ┌──────────────────┐
                         │  Object Storage  │
                         │       S3         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │       CDN        │
                         │ HLS Delivery     │
                         └────────┬─────────┘
                                  │
                                  ▼
                             HLS.js Player
```

### Planned Services

#### 1. API Gateway

The gateway becomes the public entry point.

Responsibilities:

- Request routing
- Authentication/token validation
- Rate limiting
- CORS
- Request logging
- Service discovery integration
- Centralized API policies

Clients should not need to know the internal addresses of individual services.

---

#### 2. Auth Service

Responsible for authentication and authorization.

```text
Login
  ↓
Credential validation
  ↓
JWT generation
  ↓
Client
```

Responsibilities:

- User authentication
- JWT generation
- Refresh tokens
- Password management
- Roles/permissions
- Token validation
- Account security

---

#### 3. User Service

Responsible for user-related domain data.

Examples:

```text
User
Profile
Avatar
Preferences
Watch history
```

This service owns the user domain instead of allowing every service to directly manipulate user tables.

---

#### 4. Video Service

The Video Service becomes the main domain service for videos.

Responsibilities:

- Video metadata
- Upload initialization
- Ownership
- Visibility
- Video status
- Video lifecycle
- Playback authorization
- Publishing/unpublishing videos

Example lifecycle:

```text
UPLOAD_REQUESTED
       ↓
UPLOADING
       ↓
PROCESSING
       ↓
READY
       ↓
PUBLISHED
```

The Video Service should **not perform heavy FFmpeg work itself**.

Instead, it publishes a processing job.

```text
Video Service
     │
     ▼
Message Queue
     │
     ▼
Transcoding Workers
```

---

## Transcoding Service

Video encoding will eventually become its own independently scalable subsystem.

Instead of:

```text
Spring Boot
    │
    └── FFmpeg
```

the architecture becomes:

```text
Video Service
      │
      ▼
Message Queue
      │
      ▼
Transcoding Service
      │
      ├── Worker 1 → FFmpeg
      ├── Worker 2 → FFmpeg
      ├── Worker 3 → FFmpeg
      └── Worker N → FFmpeg
```

Each job can contain information such as:

```text
videoId
sourceLocation
requestedQualities
outputLocation
```

A worker:

1. downloads/reads the source video
2. runs FFmpeg
3. generates HLS variants
4. uploads the output
5. reports success/failure
6. updates the processing state

This allows transcoding capacity to scale independently from API traffic.

---

## Message Queue

The queue decouples the API from expensive media processing.

Example:

```text
POST /videos
      │
      ▼
Video Service
      │
      │ publish VideoProcessingRequested
      ▼
Kafka / RabbitMQ
      │
      ▼
Transcoding Worker
```

This solves several problems:

- API requests do not wait for FFmpeg
- failed jobs can be retried
- workers can scale independently
- processing load can be buffered
- multiple workers can process videos concurrently
- services remain loosely coupled

Potential events:

```text
VideoUploaded
VideoProcessingRequested
VideoProcessingStarted
VideoProcessingCompleted
VideoProcessingFailed
VideoPublished
VideoDeleted
```

---

## Object Storage

Local filesystem storage is useful during development but will eventually be replaced by object storage.

Current:

```text
Spring Boot
    │
    ▼
./storage/videos
```

Target:

```text
Video Service
      │
      ▼
     S3
      │
      ├── original/
      │
      ├── hls/
      │    ├── 1080p/
      │    ├── 720p/
      │    ├── 480p/
      │    └── 360p/
      │
      └── thumbnails/
```

The application should store **references and metadata**, not the actual media bytes inside PostgreSQL.

---

## CDN-Based Video Delivery

Once HLS files are stored in object storage, video delivery should move away from the application servers.

Instead of:

```text
Client
  │
  ▼
Spring Boot
  │
  ▼
HLS segment
```

the target architecture is:

```text
Client
  │
  ▼
CDN
  │
  ▼
Object Storage
```

Spring Boot is responsible for authorization and metadata, while the CDN handles high-volume media delivery.

This prevents video traffic from consuming application-server resources.

---

## Playback Authorization

A future requirement is secure playback.

Instead of exposing permanent public URLs:

```text
https://cdn.example.com/video/3/720p/segment001.ts
```

the backend can generate temporary signed playback URLs or signed cookies.

Conceptually:

```text
Client
  │
  ▼
Video Service
  │
  │ authorize playback
  ▼
Signed URL / Token
  │
  ▼
CDN
  │
  ▼
HLS content
```

This allows access to private videos without making the entire object storage bucket public.

---

## Database-per-Service Strategy

As ByteWatch evolves into microservices, services should own their data.

Instead of:

```text
                 ┌──────────────┐
Auth ───────────►│              │
Video ──────────►│ Single DB    │
User ───────────►│              │
                 └──────────────┘
```

the target is:

```text
Auth Service
     │
     ▼
Auth DB

Video Service
     │
     ▼
Video DB

User Service
     │
     ▼
User DB
```

A service should not directly query another service's database.

Communication should happen through:

- REST/gRPC for synchronous requests
- Kafka/RabbitMQ events for asynchronous workflows

This gives each service ownership over its domain.

---

## Service Communication

ByteWatch will use two communication styles.

### Synchronous

Used when an immediate response is required.

```text
Client
  │
  ▼
API Gateway
  │
  ▼
Video Service
  │
  ▼
Response
```

Potential technologies:

- REST
- gRPC

### Asynchronous

Used for long-running or event-driven operations.

```text
Video Service
     │
     ▼
Message Broker
     │
     ▼
Transcoding Worker
```

Potential technologies:

- Kafka
- RabbitMQ

Video processing is a strong candidate for asynchronous communication.

---

## Observability

Once multiple services exist, debugging becomes significantly harder.

The architecture will therefore eventually include:

```text
Services
   │
   ├── Logs ──────────► Centralized Logging
   │
   ├── Metrics ───────► Prometheus
   │
   └── Traces ────────► OpenTelemetry
                              │
                              ▼
                           Grafana
```

Important metrics include:

- upload latency
- transcoding duration
- queue depth
- failed processing jobs
- active streams
- API latency
- HTTP error rate
- CPU/memory utilization
- CDN/cache hit rate

A request or video-processing job should have a correlation ID so that its lifecycle can be followed across services.

---

## Microservice Migration Plan

We will not rewrite ByteWatch into microservices in one step.

The migration will happen gradually.

### Phase 1 — Modular Monolith

Current architecture:

```text
Spring Boot
├── Auth
├── Users
└── Videos
       └── FFmpeg
```

Goal:

- clean module boundaries
- clear interfaces
- separate responsibilities
- avoid tightly coupled code

---

### Phase 2 — Extract Transcoding

First extract the most obvious independent workload:

```text
Spring Boot
     │
     ▼
Message Queue
     │
     ▼
Transcoding Worker
     │
     ▼
FFmpeg
```

This is the first major scalability improvement because video encoding is CPU-intensive and independently scalable.

---

### Phase 3 — Move Storage to S3

Replace:

```text
Local filesystem
```

with:

```text
S3 / Object Storage
```

The application should continue using a storage abstraction so that this change does not affect the rest of the domain.

---

### Phase 4 — Add CDN

Move HLS delivery away from Spring Boot:

```text
Client → CDN → S3
```

Spring Boot continues handling:

```text
metadata
authorization
upload orchestration
```

---

### Phase 5 — Extract Auth Service

Move authentication into an independent service:

```text
API Gateway
     │
     ├── Auth Service
     │
     └── Video Service
```

JWT-based authentication makes this boundary relatively clean.

---

### Phase 6 — Extract User Service

User/profile responsibilities move into their own service.

```text
Auth Service
User Service
Video Service
```

Each service owns its own domain data.

---

### Phase 7 — Introduce Event-Driven Workflows

Introduce domain events:

```text
VideoUploaded
     ↓
VideoProcessingRequested
     ↓
VideoProcessingCompleted
     ↓
VideoPublished
```

This makes the platform more resilient and reduces direct coupling between services.

---

### Phase 8 — Production Infrastructure

Final target:

```text
                     ┌─────────────┐
                     │   Client    │
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │ API Gateway │
                     └──────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
      Auth Service      User Service      Video Service
          │                 │                 │
          ▼                 ▼                 ▼
       Auth DB           User DB          Video DB
                                                │
                                                ▼
                                           Kafka/RabbitMQ
                                                │
                                  ┌─────────────┼─────────────┐
                                  ▼             ▼             ▼
                              Worker 1      Worker 2      Worker N
                                  │             │             │
                                  └─────────────┼─────────────┘
                                                ▼
                                           Object Storage
                                                │
                                                ▼
                                               CDN
                                                │
                                                ▼
                                             HLS.js
```

---

## Microservice Engineering Goals

The migration is not being done simply to "use microservices."

Each boundary should solve a real engineering problem.

| Component | Reason for separation |
|---|---|
| Auth Service | Independent security/auth lifecycle |
| User Service | User-domain ownership |
| Video Service | Core video metadata and lifecycle |
| Transcoding Workers | CPU-heavy independent scaling |
| Message Broker | Decouple long-running workflows |
| Object Storage | Durable large-file storage |
| CDN | High-volume media delivery |
| API Gateway | Centralized API entry point |
| Observability | Debug distributed systems |

The final architecture should therefore be **distributed because the workload requires it**, rather than because microservices are inherently better.

---

## Long-Term ByteWatch Architecture

The end goal is:

```text
                    BYTEWATCH
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   API Platform    Processing      Delivery
        │              │              │
        ▼              ▼              ▼
   Microservices   FFmpeg Workers     CDN
        │              │              │
        ▼              ▼              ▼
   Service DBs     Message Queue    S3
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                 Observability
```

The project will be developed toward this architecture incrementally, with the current Spring Boot implementation serving as the foundation.


## Future Architecture

The current implementation is intentionally a monolith.

A production-oriented version could evolve toward:

``` text
                    ┌───────────────┐
                    │    Client     │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ API Gateway    │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     Auth Service      Video Service     Streaming Service
          │                 │                 │
          ▼                 ▼                 ▼
       Database           Queue            CDN
                            │                 │
                            ▼                 ▼
                    Encoding Workers      Object Storage
                            │
                            ▼
                          FFmpeg
```

Potential additions include:

-   Redis caching
-   Kafka/RabbitMQ job queues
-   S3-compatible object storage
-   CDN delivery
-   thumbnail generation
-   video metadata extraction
-   multiple audio tracks
-   subtitles
-   resumable uploads
-   upload progress tracking
-   rate limiting
-   role-based access control
-   signed playback URLs
-   HLS encryption
-   video analytics
-   watch history
-   recommendations
-   content moderation
-   live streaming

------------------------------------------------------------------------

## Scaling the Processing Layer

The current setup uses a small local executor.

At scale, transcoding should become an independent worker system:

``` text
Upload API
    │
    ▼
Message Queue
    │
    ├──────────────┐
    ▼              ▼
Worker 1        Worker 2
    │              │
  FFmpeg         FFmpeg
    │              │
    └──────┬───────┘
           ▼
      Object Storage
```

This allows encoding capacity to scale independently from API traffic.

------------------------------------------------------------------------

## What ByteWatch Demonstrates

ByteWatch is intended to demonstrate more than CRUD APIs.

The project covers several backend engineering concepts:

-   REST API design
-   Spring Boot architecture
-   dependency injection
-   JPA/Hibernate
-   PostgreSQL
-   authentication
-   JWT
-   Spring Security filters
-   file uploads
-   filesystem abstraction
-   asynchronous processing
-   thread pools
-   external process execution
-   FFmpeg
-   video transcoding
-   HLS
-   adaptive bitrate streaming
-   static media serving
-   CORS
-   API security
-   frontend/backend integration

The most important system-design lesson is that **video upload, video
processing, video storage, and video delivery are separate
responsibilities**.

------------------------------------------------------------------------

## Project Status

### Implemented

-   [x] Spring Boot backend
-   [x] PostgreSQL integration
-   [x] User management
-   [x] JWT authentication
-   [x] Spring Security
-   [x] Multipart video upload
-   [x] Local video storage
-   [x] Video metadata
-   [x] Processing states
-   [x] Async video processing
-   [x] FFmpeg integration
-   [x] HLS generation
-   [x] Multiple video qualities
-   [x] HLS playlist serving
-   [x] HLS segment serving
-   [x] HLS.js playback testing

### Planned

-   [ ] Production object storage
-   [ ] CDN delivery
-   [ ] Distributed transcoding workers
-   [ ] Message queue
-   [ ] Thumbnail generation
-   [ ] Resumable uploads
-   [ ] Playback authorization
-   [ ] Signed URLs
-   [ ] Watch history
-   [ ] Analytics
-   [ ] Live streaming
-   [ ] Production deployment

------------------------------------------------------------------------

## Project Goal

ByteWatch is being built as a backend-heavy exploration of how a video
platform works internally.

The long-term goal is to evolve it from:

``` text
Spring Boot + Local Storage + FFmpeg
```

into:

``` text
Authenticated Video Platform
          +
Distributed Processing
          +
Object Storage
          +
CDN
          +
Adaptive Streaming
          +
Playback Authorization
          +
Analytics
```

That progression makes the project useful both as a working VOD platform
and as a system-design exercise.
