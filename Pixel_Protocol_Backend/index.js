const http = require('http');
const ethers = require('ethers');
const fs = require('fs');

const { contractABI, contractAddress } = require('./constants/contract')

const hostname = 'localhost';
const port = 8000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
});

const { Server } = require("socket.io");
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: "https://pixel-protocol.vercel.app",
        methods: ["GET", "POST"]
    }
});

const arrayBuffer = new ArrayBuffer(3000000); // 3 million bytes
const arrayView = new Uint8Array(arrayBuffer);

for (let i = 0; i < 3000000; i += 3) {
    arrayView[i] = 0;
    arrayView[i + 1] = 0;
    arrayView[i + 2] = 0;
}


const hexToRGB = (c) => {
    const dec = Number(c)
    return [Math.floor(dec / (256 * 256)), Math.floor(dec / 256) % 256, dec % 256]
}

const getOffset = (x, y) => {
    return 3 * (y * 1000 + x)
}


const mumbaiAPIKey = process.env.ALCHEMY_API_KEY_MUMBAI;
const mumbaiProvider = new ethers.providers.AlchemyProvider("maticmum", mumbaiAPIKey);

const contract = new ethers.Contract(contractAddress, contractABI, mumbaiProvider);


contract.on("ColorChange", (_, x, y, newColor) => {
    const [r, g, b] = hexToRGB(newColor);
    const X = x.toNumber()
    const Y = y.toNumber()
    const offset = getOffset(X, Y);
    console.log("Color change!")
    console.log(`(${x},${y}), ${newColor}`)
    if (r !== arrayView[offset] || g !== arrayView[offset + 1] || b !== arrayView[offset + 2]) {
        arrayView[offset] = r; arrayView[offset + 1] = g; arrayView[offset + 2] = b;
        console.log(arrayView[offset])
        console.log(arrayView[offset + 1])
        console.log(arrayView[offset + 2])

        io.emit('pixelData', {
            x: X,
            y: Y,
            rgb: [r, g, b]
        });
    }


})


io.on('connection', (socket) => {
    socket.emit('canvasData', arrayView)
    socket.on('requestCanvasData', () => {
        socket.emit('canvasData', arrayView)
    })
});



server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

const STEP = 25;
var startIndex = 0;


setInterval(function () {
    const promises = []
    for (let i = startIndex; i < 1000; i += STEP) {
        promises.push(contract.getCanvasRow(i))
    }

    Promise.all(promises).then(values => {
        if (values.length === 0) {
            throw Error("No promises resolved.")
        }
        if (values.length !== promises.length) {
            throw Error("Not all promises resolved.")
        }
        for (let col = startIndex; col < 1000; col += STEP) {
            /*
            console.log("row start")
            console.log(values[Math.floor(col / STEP)])
            console.log("row end")*/
            const rgbRow = values[Math.floor(col / STEP)].flatMap((hex) => hexToRGB(hex));
            if (rgbRow.length !== 3000) {
                throw Error("Invalid length of row returned.")
            }
            for (let row = 0; row < 1000; row++) {
                const offset = getOffset(col, row);
                const rPos = row * 3, gPos = rPos + 1, bPos = gPos + 1;
                arrayView[offset] = rgbRow[rPos];
                arrayView[offset + 1] = rgbRow[gPos];
                arrayView[offset + 2] = rgbRow[bPos];
            }
        }
        io.emit('canvasData', arrayView);

        startIndex = (startIndex + 1) % STEP
        console.log(startIndex)
    }).catch(err => console.log(err.message))
    console.log(`Rows ${startIndex}, ${startIndex + STEP}... updated`);
}, 10000);




//save canvas state on exit

async function exitHandler() {
    try {
        const latestBlock = await mumbaiProvider.getBlockNumber()
        fs.writeFileSync(`log_${+ new Date()}`, JSON.stringify({ latestBlock: latestBlock }))
    } catch (e) {
        console.error('EXIT HANDLER ERROR', e);
    }
    process.exit()
}

[
    'beforeExit', 'uncaughtException', 'unhandledRejection',
    'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
    'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
    'SIGUSR2', 'SIGTERM',
].forEach((eventType) => {
    process.on(eventType, exitHandler);
})


process.on("exit", () => {
    console.log(`APP stopped !`);
});
