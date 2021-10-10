import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import React, {useState} from "react";
import { v4 as uuidv4 } from 'uuid';
// ES6 import or TypeScript
import { io } from "socket.io-client";

export default function Home() {

  const [myStream, setMyStream] = useState();
  const [theirStream, setTheirStream] = useState();

  React.useEffect(() => {
    const fn = async () => {
      const socket = io('http://localhost:4000')
      const PeerJs = (await import('peerjs')).default;
      // set it to state here

      let id = uuidv4()
      const peer = new PeerJs(undefined, {
        host: 'localhost',
        port: 9000,
        path: '/peerjs',

      });

      //called when you're peer connection is open
      peer.on('open',function(myId){
        console.log('open');
        socket.emit('join-room', 8, myId)
      });

      //this is called when someone has made a connection to you
      peer.on('connection', function(conn) {
        console.log('Connection made');
        console.log(conn)
        conn.on('open', function (idd) {
          console.log("connection open", idd)
          conn.on('data', function (data) {
            console.log('Data: ' + data);
          });
        });
      })






      const myVideo = document.getElementById('videoOne')
      myVideo.muted = true

      const myVideoTwo = document.getElementById('videoTwo')
      myVideoTwo.muted = true

      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).then(stream => {
        addVideoStream(myVideo, stream)

        connectToPeer(peer,socket, stream, id)

      })

    }
    fn()
  }, []); // empty array here ensures this is only executed once (when that component mounts).



  const connectToPeer = (peer,socket, stream, id) =>{
    console.log("connect to peer")
    // answer stream if you are the one being called
    peer.on('call', (call) => {
      console.log("someone is calling")
      call.answer(stream)
      const video = document.getElementById('videoTwo')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })


    socket.on('user-connected', (userId) => {
      console.log("user connected ", userId)
      console.log("my  id ", id)

      if(userId !== id){
        //only called once??
        //but can listen to peer.on('connection'... above
        let conn = peer.connect(userId);
        // on open will be launch when you successfully connect to PeerServer
        conn.on('open', function(data){
          // here you have conn.id
          console.log(data)
          setTimeout(connectToNewUser(userId, stream, peer), 1000)

          console.log("connected to peer")
          conn.send('hi!');
        });
      }

    })

  }

  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
      // video.muted = false
    })
  }

  function connectToNewUser(userId, stream, peer) {
    const video = document.getElementById('videoTwo')

    const call = peer.call(userId, stream)
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })

    // peers[userId] = call
  }

  return (
    <div className={styles.container}>
      <video id="videoOne" width="1280px" height="720px" />
      <video id="videoTwo" width="1280px" height="720px" />
    </div>
  )
}
