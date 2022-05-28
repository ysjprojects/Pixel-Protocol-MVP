import type { NextPage } from 'next'
import { useState, useEffect, useRef } from 'react'
import { useGesture } from '@use-gesture/react'
import Sidebar from '../components/Sidebar'
import Pill from '../components/Pill'
import Header from "../components/Header"
import { io } from "socket.io-client";
import { Coordinates } from '../types';
import { useMoralis } from 'react-moralis'
import contractAddresses from "../constants/contractAddresses.json"
import { ContractAddresses } from '../types'
import { Button, Modal } from 'web3uikit'

const socket = io("d3perkfc3597u7.cloudfront.net");



const Home: NextPage = () => {
  const caddresses: ContractAddresses = contractAddresses;

  const { isWeb3Enabled, chainId } = useMoralis()
  const [connected, setConnected] = useState(false)


  const [dragStart, setDragStart] = useState<Coordinates | null>(null);
  const [dragged, setDragged] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [pointerPosition, setPointerPosition] = useState<Coordinates | null>(null);
  const [pointSelected, setPointSelected] = useState(false);
  const [c, setC] = useState<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageData = useRef<ImageData | null>(null);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false)



  const redraw = useRef(() => {
    requestAnimationFrame(redraw.current);
  });


  const calculateRealPosition = (ptX: number, ptY: number) => {
    if (!ctx) {
      const x = -1;
      const y = -1;
      return { x, y }
    }
    const T_p = ctx.getTransform().invertSelf();
    const x = Math.round(ptX * T_p.a + ptY * T_p.c + T_p.e - 0.5);
    const y = Math.round(ptX * T_p.b + ptY * T_p.d + T_p.f - 0.5);
    return { x, y };
  }

  const adjustZoom = (zoomAmount: number, zoomPt: Coordinates) => {
    const newZoom = Math.min(Math.max(cameraZoom + zoomAmount, 0.5), 25);
    if (newZoom == cameraZoom) return;

    const scaleDelta = newZoom - cameraZoom
    setCameraZoom(newZoom);

    if (zoomPt != null) {
      setLastX((prevLastX) => prevLastX - (zoomPt.x * scaleDelta) / newZoom)
      setLastY((prevLastY) => prevLastY - (zoomPt.y * scaleDelta) / newZoom)
    }
  }

  const moveToPoint = (x: number, y: number) => {
    if (x < 0 || x >= 1000 || y < 0 || y >= 1000) return;

    setPointerPosition({ x, y })
    setPointSelected(true);

    setLastX(-x + window.innerWidth / (2 * 25));
    setLastY(-y + window.innerHeight / (2 * 25));
    setCameraZoom(25);
  }

  useGesture({
    onDragStart: ({ xy }) => {
      setDragStart({
        x: xy[0] / cameraZoom - lastX,
        y: xy[1] / cameraZoom - lastY
      });
      setDragged(true)
    },
    onDrag: ({ xy, pinching }) => {
      if (!dragged || pinching) return;
      const newLastX = xy[0] / cameraZoom - dragStart!.x;
      const newLastY = xy[1] / cameraZoom - dragStart!.y;

      const EDGE_PAD = 300 / cameraZoom;
      if (newLastX < -1000 + EDGE_PAD || newLastX > window.innerWidth / cameraZoom - EDGE_PAD) return;
      if (newLastY < -1000 + EDGE_PAD || newLastY > window.innerHeight / cameraZoom - EDGE_PAD) return;

      setLastX(newLastX);
      setLastY(newLastY)
    },
    onDragEnd: () => {
      setDragged(false);
    },
    onWheel: ({ pinching, event }) => {
      if (pinching) return;

      const zoomFactor = event.deltaY * 0.01
      const x = event.offsetX || event.pageX;
      const y = event.offsetY || event.pageY;

      adjustZoom(zoomFactor, { x: x / cameraZoom, y: y / cameraZoom })
    },
    onPinch: ({ offset, delta, event }) => {
      const zoomFactor = delta[0] / offset[0];
      const x = event.offsetX || event.pageX;
      const y = event.offsetY || event.pageY;
      adjustZoom(zoomFactor, { x: x / cameraZoom, y: y / cameraZoom })
    },
    onMove: ({ event }) => {
      if (dragged || pointSelected) return;

      const { x, y } = calculateRealPosition(event.clientX, event.clientY);
      if (0 <= x && x < 1000 && 0 <= y && y < 1000) {
        setPointerPosition({ x, y });
      }
    },
    onClick: ({ event, moving, pinching, wheeling }) => {
      if (dragged || moving || pinching || wheeling) return;

      const { x, y } = calculateRealPosition(event.clientX, event.clientY);
      moveToPoint(x, y);
    },
  },
    {
      target: canvasRef,
      eventOptions: {
        passive: false
      },
      drag: {
        preventScroll: true,
        filterTaps: true
      },
      pinch: {
        preventDefault: true,
      },
      wheel: {
        preventDefault: true,
        threshold: 10
      }
    }
  )


  useEffect(() => {
    const validChainId = (isWeb3Enabled) ? ((chainId) ? parseInt(chainId) in caddresses : false) : false

    setConnected(validChainId)
  }, [isWeb3Enabled, chainId])


  useEffect(() => {
    const canvas = document.getElementById("pixelCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setC(canvas);
    setCtx(ctx);
    setLastX(window.innerWidth / 2 - 500)
    setLastY(window.innerHeight / 2 - 500)

    offscreenCanvas.current = document.createElement('canvas');
    offscreenCanvas.current.width = 1000;
    offscreenCanvas.current.height = 1000;

    redraw.current();

    socket.on("canvasData", (data) => {
      const dataArr = new Uint8Array(data);

      const arr = new Uint8ClampedArray(4000000);
      for (let i = 0; i < 3000000; i += 3) {
        const r = dataArr[i];
        const g = dataArr[i + 1];
        const b = dataArr[i + 2];
        const idx = Math.floor(i / 3) * 4;
        arr[idx] = r;
        arr[idx + 1] = g;
        arr[idx + 2] = b;
        arr[idx + 3] = 255;
      }
      imageData.current = new ImageData(arr, 1000, 1000);
      offscreenCanvas.current.getContext('2d').putImageData(imageData.current, 0, 0);
    })
    socket.on("pixelData", (data) => {
      const x = data.x; const y = data.y; const rgb = data.rgb;
      const r = rgb[0];
      const g = rgb[1];
      const b = rgb[2];
      const idx = (y * 1000 + x) * 4;
      console.log("pixelData emitted")
      console.log(x)
      console.log(y)
      console.log(`r: ${r} g: ${g} b: ${b} idx:${idx}`)

      if (imageData.current) {
        imageData.current.data[idx] = r;
        imageData.current.data[idx + 1] = g;

        imageData.current.data[idx + 2] = b;

        imageData.current.data[idx + 3] = 255;
        offscreenCanvas.current.getContext('2d').putImageData(imageData.current, 0, 0);
      }
      else {
        socket.emit("requestCanvasData")
      }

    })
  }, []);



  useEffect(() => {
    if (ctx == null || c == null) return;

    redraw.current = () => {
      if (ctx == null || c == null) {
        requestAnimationFrame(redraw.current);
        return;
      };

      c.width = window.innerWidth
      c.height = window.innerHeight


      ctx.scale(cameraZoom, cameraZoom)
      ctx.translate(lastX, lastY)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)


      //So that canvas won't be blurred on zoom
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(offscreenCanvas.current, 0, 0);

      if (pointerPosition) {
        ctx.strokeStyle = 'rgba(255, 255, 0)';
        ctx.lineWidth = 0.2
        ctx.rect(pointerPosition.x, pointerPosition.y, 1, 1);
        ctx.stroke();
      }


      requestAnimationFrame(redraw.current);
    };

  }, [ctx, c, lastX, lastY, cameraZoom, pointerPosition])


  return (
    < div >
      <Header />
      <Modal
        cancelText="Discard Changes"
        id="networkerrormodal"
        isCancelDisabled
        isOkDisabled
        isVisible={isModalVisible}
        hasFooter={false}
        okText="Save Changes"
        onCloseButtonPressed={() => setIsModalVisible(false)}
        title="Please connect to a supported network:"
      >
        <div className='mb-2'> <p>Matic/Polygon Mumbai Testnet</p></div>

      </Modal>


      <div id="canvas-container" className='bg-slate-300' style={{ overflow: 'hidden', height: '100vh' }}>
        <canvas id="pixelCanvas" width={1000} height={1000} style={{ imageRendering: 'pixelated', touchAction: 'none' }} ref={canvasRef}></canvas>
      </div>
      <Pill pointerPosition={pointerPosition as Coordinates} cameraZoom={cameraZoom} moveToPoint={moveToPoint} />
      {/*<button onClick={() => adjustZoom(1)} style={{ position: 'absolute', right: 15, bottom: 30 }}>+</button>
      <button onClick={() => adjustZoom(-1)} style={{ position: 'absolute', right: 15, bottom: 10 }}>-</button>*/}
      {
        (pointSelected && connected) ? <Sidebar setPointSelected={setPointSelected} setPointerPosition={setPointerPosition} pointerPosition={pointerPosition as Coordinates} />
          : null
      }
      {(connected) ? null : <div style={{ position: "absolute", bottom: "30px", right: "30px" }}>

        <Button
          color="red"
          icon="exclamation"
          id="test-button-primary"
          onClick={() => setIsModalVisible(!isModalVisible)}
          text="Network Error"
          theme="colored"
          type="button"
          size='large'
        />

      </div>}
    </div >

  )
}

export default Home;
