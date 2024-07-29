# Live Streaming API は、リアルタイム ビデオ ストリーミング用に特別に設計された専用の/talks/streamsエンドポイントを提供します。

## SDPオファーはストリームを開始する
セッション記述プロトコル (SDP) は、ピア間のセッションの詳細をネゴシエートおよび交換するために使用されます。開始ピアは自身の機能を含む SDP オファーを送信し、受信ピアは自身の機能を含む SDP 回答で応答します。

### ICE候補者はネットワーク情報を提出する
インタラクティブ接続確立 (ICE) は、ピア間の最適なネットワーク パスを決定するために使用される手法です。ICE 候補は、接続に使用できる可能性のある IP アドレスとトランスポート プロトコルを表します。

## Live Streaming API の使い方
Step 1: Create a new stream
To initiate a video streaming session, make a POST request to /streams endpoint. In the request’s body, you must provide a source_url pointing to the photo you wish to animate in the stream. This request will provide you with a unique id (referred to as stream_id in other requests) and a session ID. The stream ID serves as a unique identifier for the streaming session, while the session ID needs to be included in subsequent requests' bodies to ensure they reach the correct server instance.
Make sure to extract and store both the stream ID (your_stream_id) and session ID (your_session_id) for further usage in subsequent steps.

Step 2: Starting the stream
After receiving the SDP offer from the server in Step 1, you need to generate the SDP answer and send it back. To obtain the SDP answer, you can use WebRTC APIs or libraries that provide the necessary functionality. Here is a general outline of the steps involved:

Create a WebRTC peer connection object in your application.
Set the received SDP offer as the remote description of the peer connection using the setRemoteDescription() method.
Generate the SDP answer by calling the createAnswer() method on the peer connection.
Set the generated SDP answer as the local description of the peer connection using the setLocalDescription() method.
Once you have obtained the SDP answer as a string, you can send it back to the server using the /talks/streams/{session_id}/sdp endpoint.

Step 3: Submit network information
Once the SDP answer is sent, you must gather ICE candidates and send them to the server to complete the WebRTC handshake. ICE candidates allow the peers to discover and establish an optimal network path for communication.

Listen for the icecandidate event on your peer connection object and send each ICE candidate to the server using the /talks/streams/{stream_id}/ice endpoint. Replace {stream_id} with the appropriate stream ID obtained in Step 1. From the ice candidates you receive, you should only send the candidate, sdpMid, and sdpMLineIndex attributes.

Waiting for Connection Readiness:
After sending the SDP answer and the ICE candidates, you need to wait for the WebRTC connection to become ready. Listen for the iceconnectionstatechange event on your peer connection object and check for the iceConnectionState property. When the connection state changes to connected or completed, the connection is ready to proceed. This event listener is one of those we used in Step 2, specifically, onIceConnectionStateChange

Step 4: Create a talk stream
With the connection established, you can now create a talk. Make a POST request to /talks/streams/{stream_id} endpoint to request a video to be created and streamed over the established connection. Remember to include the session ID in the request body. In this request you can send the details of the audio or text for the avatar to speak, along with additional configuration options that allow for greater flexibility and customization.

Step 5: Closing the stream
To close the video streaming session, make a DELETE request to /talks/streams/{stream_id} endpoint. This will close the connection and end the session. If no messages are sent within the session for 5 minutes, the session will be automatically terminated.

# API情報
## Create a new stream
post
https://api.d-id.com/talks/streams
Initiates the creation of a new WebRTC connection to a browser peer. The endpoint returns the necessary information to set up and manage the connection.

Body Params
source_url
string
required
URL to a photo you wish to animate in the stream

driver_url
string
The URL of the driver video to drive the talk, or a selection from the list or provided drivers.
If not provided a driver video will be selected for you from the predefined drivers bank.

face
object
the face to animate - otherwise detects the dominant face

config
object
Advanced configuration options.

compatibility_mode
string
Defines the video codec to be used in the stream.
When set to on: VP8 will be used.
When set to off: H264 will be used
When set to auto the codec will be selected according to the browser.

stream_warmup
boolean
Defaults to false
Whether to stream wamrup video on the connection.
If set to true, will stream a warmup video when connection is established.
At the end of the warmup video, a message containing "stream/ready" will be sent on the data channel.

session_timeout
double
≤ 300
Maximum duration (in seconds) between messages before session times out.
Can only be used with proper permissions

output_resolution
double
0 to 1080
Supported only with Talk presenters (photo-based).
The output resolution sets the maximum height or width of the streamed video.
The aspect ratio is preserved from the source image.
When resolution is not configured, it defaults to the agent output resolution.

## Start a stream
post
https://api.d-id.com/talks/streams/{id}/sdp
Updates the server with the SDP answer to the SDP offer received from the initial call to the /streams endpoint, during the offer/answer negotiation of a WebRTC connection.

Body Params
session_id
string
Session identifier information, should be returned in the body of all streaming requests (from the response
of the POST /streams)

answer
object
required
Jsep answer object used to create a peer connection

## Submit network information
post
https://api.d-id.com/talks/streams/{id}/ice
Updates the server with a WebRTC ICE candidate. If the candidate parameter is missing or a value of null is given the added ICE candidate is an "end-of-candidates" indicator.

Once the SDP answer is sent, you must gather ICE candidates and send them to the server to complete the WebRTC handshake. ICE candidates allow the peers to discover and establish an optimal network path for communication. Listen for the icecandidate event on your peer connection object and send each ICE candidate to the server using this endpoint. Replace {stream_id} with the appropriate stream ID obtained in Step 1. From the ice candidates you receive, you should only send the candidate, sdpMid, and sdpMLineIndex attributes. Learn more

Body Params
IceCandidate
Option 2

## Create a talk stream
post
https://api.d-id.com/talks/streams/{id}

With the connection established, you can now create a talk. Make a POST request to this endpoint to request a video to be created and streamed over the established connection. Remember to include the session ID in the request body. In this request you can send the details of the audio or text for the avatar to speak, along with additional configuration options that allow for greater flexibility and customization. Learn more

Body Params
session_id
string
result_url
string
The URL to save the video result.

script
required

config
object
Construct a type with the properties of T except for those in type K.

user_data
string
Non-sensitive custom data that will be added to the talk response and webhook.

name
string
The name of the talk video

audio_optimization
double
Defaults to 2
The optimization level of the audio

metadata
string
Metadata passed to the talks worker

## Delete a talk stream
delete
https://api.d-id.com/talks/streams/{id}

Body Params
session_id
string