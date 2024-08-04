// YAML ファイルを読み込む
import yaml from 'js-yaml';

// api.yaml ファイルを読み込む
const response = await fetch('./api.yaml');
const yamlText = await response.text();
const apiConfig = yaml.load(yamlText);


// API キーの存在チェック
if (!apiConfig.dId.key || !apiConfig.openAI.key || !apiConfig.elevenLabs.key) {
  throw new Error('APIキーが設定されていません。');
}

const DID_API = apiConfig.dId;
const OPENAI_API_KEY = apiConfig.openAI.key;
const ELEVENLABS_API_KEY = apiConfig.elevenLabs.key;


const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let pcDataChannel;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let lastBytesReceived;
let videoIsPlaying = false;
let streamVideoOpacity = 0;

const stream_warmup = true;
let isStreamReady = !stream_warmup;

const idleVideoElement = document.getElementById('idle-video-element');
const streamVideoElement = document.getElementById('stream-video-element');
idleVideoElement.setAttribute('playsinline', '');
streamVideoElement.setAttribute('playsinline', '');
const statusContainer = document.querySelector('.status-container');
const statusLabel = document.getElementById('status-label');

const presenterInputByService = {
  talks: {
    source_url: 'https://huggingface.co/datasets/smorce/IconAssets/resolve/main/stela2_removebg.png',  // 背景を消したら通った。サーバーにアップロードしたファイルでないと D-iD の API は受け取れない
  },
  clips: {
    presenter_id: 'rian-lZC6MmWfC1',
    driver_id: 'mXra4jY38i',
  },
};

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  statusContainer.className = 'status-container connecting';
  statusLabel.textContent = "接続中...";

  const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...presenterInputByService[DID_API.service], stream_warmup }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;

  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.error('Error during streaming setup', e);
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "エラー発生";
    stopAllStreams();
    closePC();
    return;
  }

  await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });

  statusContainer.className = 'status-container connected';
  statusLabel.textContent = "接続完了";
};

const startButton = document.getElementById('start-button');
startButton.onclick = () => {
  if (
    (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') &&
    isStreamReady
  ) {
    startSpeechRecognition();
  } else {
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "まだ接続されていません";
  }
};

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();

  statusContainer.className = 'status-container error';
  statusLabel.textContent = "接続を切断しました";
};

function onIceGatheringStateChange() {
  console.log('ICE gathering state change:', peerConnection.iceGatheringState);
}

function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  } else {
    fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  }
}

function onIceConnectionStateChange() {
  console.log('ICE connection state change:', peerConnection.iceConnectionState);
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "接続が切断されました";
  }
}

function onConnectionStateChange() {
  console.log('Connection state change:', peerConnection.connectionState);
  if (peerConnection.connectionState === 'connected') {
    playIdleVideo();
    setTimeout(() => {
      if (!isStreamReady) {
        console.log('Forcing stream/ready');
        isStreamReady = true;
        statusContainer.className = 'status-container ready';
        statusLabel.textContent = "準備完了(強制番なので良くない気がする)";
      }
    }, 5000);
  }
}

function onSignalingStateChange() {
  console.log('Signaling state change:', peerConnection.signalingState);
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;

  if (videoIsPlaying) {
    status = 'streaming';
    streamVideoOpacity = isStreamReady ? 1 : 0;
    setStreamVideoElement(stream);
  } else {
    status = 'empty';
    streamVideoOpacity = 0;
  }

  streamVideoElement.style.opacity = streamVideoOpacity;
  idleVideoElement.style.opacity = 1 - streamVideoOpacity;
}

function onTrack(event) {
  if (!event.track) return;

  // ビデオフレームの受信を定期的にチェック
  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

function onStreamEvent(message) {
  if (pcDataChannel.readyState === 'open') {
    const [event, _] = message.data.split(':');

    switch (event) {
      case 'stream/started':
        console.log('Stream started');
        statusLabel.textContent = "ストリーミング中";
        break;
      case 'stream/done':
        console.log('Stream done');
        statusLabel.textContent = "ストリーミング終了";
        // ストリーミング終了後、音声認識を再開
        setTimeout(() => {
          startSpeechRecognition();
        }, 1000); // 1秒後に音声認識を開始
        break;
      case 'stream/ready':
        setTimeout(() => {
          console.log('Stream ready');
          isStreamReady = true;
          statusContainer.className = 'status-container ready';
          statusLabel.textContent = "準備完了";
        }, 1000);
        break;
      case 'stream/error':
        console.error('Stream error');
        break;
      default:
        console.log('Stream event:', event);
        break;
    }
  }
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    pcDataChannel = peerConnection.createDataChannel('JanusDataChannel');
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
    pcDataChannel.addEventListener('message', onStreamEvent, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('Set remote SDP OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('Create local SDP OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('Set local SDP OK');

  return sessionClientAnswer;
}

function setStreamVideoElement(stream) {
  if (!stream) return;

  streamVideoElement.srcObject = stream;
  streamVideoElement.loop = false;
  streamVideoElement.mute = !isStreamReady;

  if (streamVideoElement.paused) {
    streamVideoElement
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  idleVideoElement.src = DID_API.service == 'clips' ? 'assets/rian_idle.mp4' : 'assets/stela2_idle.mp4';
}

function stopAllStreams() {
  if (streamVideoElement.srcObject) {
    console.log('Stopping video streams');
    streamVideoElement.srcObject.getTracks().forEach((track) => track.stop());
    streamVideoElement.srcObject = null;
    streamVideoOpacity = 0;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('Stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  pc.removeEventListener('onmessage', onStreamEvent, true);

  clearInterval(statsIntervalId);
  isStreamReady = !stream_warmup;
  streamVideoOpacity = 0;
  console.log('Stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

// --- 音声認識とGPT/TTSの処理 ---

let recognition;
let isRecognitionActive = false;    // 音声認識の状態を管理するフラグ

function startSpeechRecognition() {
  if (isRecognitionActive) {
    console.log('音声認識はすでに実行中です');
    return;
  }
  isRecognitionActive = true;
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;

  recognition.onstart = () => {
    console.log('音声認識開始');
    statusLabel.textContent = "音声認識開始";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    console.log('認識結果:', transcript);
    statusLabel.textContent = "認識結果: " + transcript;

    // 音声認識を一時停止
    stopSpeechRecognition();

    const gptResponse = await getGPTResponse(transcript);
    const audioURL = await synthesizeSpeech(gptResponse);
    await sendScriptToDId(audioURL);
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      console.log('音声入力なし、継続してリスニング');
      return; // no-speech エラーを無視
    }
    console.error('音声認識エラー:', event.error);
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "音声認識エラー";
    isRecognitionActive = false;
    // エラー後に再開
    setTimeout(startSpeechRecognition, 1000);
  };

  recognition.onend = () => {
    console.log('音声認識終了');
    if (isRecognitionActive) {
      // まだアクティブな場合は再開
      recognition.start();
    }
  };

  recognition.start();
}

// 音声認識を停止する関数
function stopSpeechRecognition() {
  if (recognition) {
    recognition.stop();
    isRecognitionActive = false;
  }
}

async function getGPTResponse(prompt) {
  statusLabel.textContent = "GPT応答待ち...";

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'ステラとしてロールプレイしてください。ステラは可愛くて綺麗でそれでいてカッコいい一面もありちょっと抜けているギャップも持ち合わせ、明るい性格で計算がなく分け隔てのない人付き合いができ、他人の幸福を自分のことのように喜ぶことができて、他人の不幸は自分のことのように悲しむことができて、決して人の悪口を言わず、決して人を貶めることもせず、自分を押し売りすることなく常に人の話に耳を傾け、地味でもなく派手でもなく品の良い清潔感のある服装を好み、真珠のようなきめ細やかな肌を持ち健康的でダイエット知らずなプロポーションをしていて、なおかつ頭脳明晰で男前なところもあり、仕事も私生活も充実しまくっているのにそれ等を一切鼻にかけない親しみ易い女性です。'},
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 100
    })
  });

  const data = await response.json();
  const gptMessage = data.choices[0].message.content;
  console.log('GPT応答:', gptMessage);
  statusLabel.textContent = "GPT応答: " + gptMessage;
  return gptMessage;
}

// 音声ファイルをアップロード
async function uploadAudio(audioBlob) {
  // tmpfiles.org APIを使用してファイルをアップロード
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.mp3');

  try {
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('音声のアップロードに失敗しました');
    }

    const data = await response.json();
    
    // tmpfiles.orgの応答からダウンロードURLを取得
    const downloadUrl = data.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
    
    console.log('音声ファイルのアップロードに成功しました。');
    console.log('アップしたファイルURL:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('音声のアップロード中にエラーが発生しました:', error);
    throw error;
  }
}

async function synthesizeSpeech(text) {
  statusLabel.textContent = "音声合成中...";

  const voiceId = 'cgSgspJ2msm6clMCkdW9';   // ElevenLabs 音声IDを設定

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        'text': text,
        'model_id': 'eleven_turbo_v2_5',
        'language_code': 'ja',
        'voice_settings': {
          'stability': 0.5,
          'similarity_boost': 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API Error: ${response.status} ${response.statusText}`);
    }
    const audioBlob = await response.blob();
    const audioURL = await uploadAudio(audioBlob);
    return audioURL;
  } catch (error) {
    console.error('音声合成エラー:', error);
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "音声合成エラー";
    // エラー処理を実装
  }
}


async function sendScriptToDId(audioURL) {
  statusLabel.textContent = "D-IDに送信中...";
  const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      script: {
        type: 'audio',
        audio_url: `${audioURL}`,
      },
      ...(DID_API.service === 'clips' && {
        background: {
          color: '#FFFFFF',
        },
      }),
      config: {
        stitch: true,
      },
      session_id: sessionId,
    }),
  });

  if (!playResponse.ok) {
    console.error('D-ID API Error:', playResponse.status, await playResponse.text());
    statusContainer.className = 'status-container error';
    statusLabel.textContent = "D-ID API エラー";
    return;
  }

  statusLabel.textContent = "ストリーミング開始";
}
