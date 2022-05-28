import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useNotification } from "web3uikit"
import { ethers, BigNumber } from "ethers"
import { Coordinates, ContractAddresses } from "../types";

import contractAddresses from "../constants/contractAddresses.json"
import abiNFT from '../constants/abiPixelNFT.json'
import abiMain from '../constants/abiPixelMainframe.json'
import PixelState from "./PixelState";
import Lottery from "./Lottery";
import ColorPickerModal from "./ColorPickerModal";
import { CryptoLogos, Information, Button, BannerStrip } from "web3uikit";
import MintInstruction from "./MintInstruction";
import ChangeColor from "./ChangeColor";



interface SidebarProps {
    pointerPosition: Coordinates,
    setPointSelected: Dispatch<SetStateAction<boolean>>,
    setPointerPosition: Dispatch<SetStateAction<Coordinates | null>>
}


const Sidebar = ({ pointerPosition, setPointSelected, setPointerPosition }: SidebarProps) => {
    const caddresses: ContractAddresses = contractAddresses;
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex!)
    console.log(`Chain ${chainId}`)
    const [nftAddress, mainframeAddress] = chainId in caddresses ? caddresses[chainId] : [undefined, undefined]


    const [y1, setY1] = useState(null)
    const [y2, setY2] = useState(null)


    const ref1 = useRef(null);
    const ref2 = useRef(null);

    //get contract states
    const [mintingFee, setMintingFee] = useState("0")
    const [owner, setOwner] = useState("0")
    const [isMinted, setIsMinted] = useState(false)
    const [color, setColor] = useState("#000000")
    const [tokenId, setTokenId] = useState("0")

    const [isMinting, setIsMinting] = useState(false)

    //for minting
    const [selectedColor, setSelectedColor] = useState("#000000")


    const [openColorPicker, setOpenColorPicker] = useState(false)

    const dispatch = useNotification()

    const onSidebarCancel = () => {
        setPointSelected(false);
        setPointerPosition(null);
    }


    //view functions
    const { runContractFunction: getMintStatus
    } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: 'getIsMinted(uint256,uint256)',
        params: {
            _x: pointerPosition.x,
            _y: pointerPosition.y
        }

    })

    const { runContractFunction: getOwner
    } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: 'ownerOf',
        params: {
            tokenId: BigNumber.from(tokenId)
        }

    })

    const { runContractFunction: getMintingFee } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: "getFee(uint256,uint256)",
        params: {
            _x: pointerPosition.x,
            _y: pointerPosition.y
        }
    })

    const { runContractFunction: getColor } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: "getColor(uint256)",
        params: {
            _tokenId: BigNumber.from(tokenId)
        }
    })

    const { runContractFunction: getTokenId } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: "getTokenIdAtXY",
        params: {
            _x: pointerPosition.x,
            _y: pointerPosition.y
        }
    })

    async function updateAll() {
        const isMintedFromCall = (await getMintStatus()) as boolean
        const mintingFeeFromCall = ((await getMintingFee()) as BigNumber).toString()
        setMintingFee(mintingFeeFromCall)
        setIsMinted(isMintedFromCall)

        if (isMintedFromCall) {
            const tokenIdFromCall = (await getTokenId() as BigNumber).toString()
            setTokenId(tokenIdFromCall)
            if (tokenId !== "0") {
                const colorFromCall = "#" + (await getColor() as string).substring(2)
                const ownerFromCall = (tokenId === "0") ? "0" : (await getOwner() as string).toLowerCase()

                setColor(colorFromCall)
                setOwner(ownerFromCall)
            }


        } else {
            setTokenId("0")
            setColor("#000000")
            setOwner("0")
        }


    }

    //write functions
    const {
        runContractFunction: mintNFT,
        isLoading: mintNFTIsLoading,
        isFetching: mintNFTIsFetching,
    } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: "mintNFT",
        msgValue: mintingFee,
        params: {
            _x: pointerPosition.x,
            _y: pointerPosition.y,
            _colorCode: "0x" + selectedColor.substring(1)
        }
    })




    //miscellaneous functions
    const getPosition = () => {
        if (nftAddress && mainframeAddress) {
            const y1 = ref1.current.offsetTop;
            setY1(y1);

            const y2 = ref2.current.offsetTop;
            setY2(y2);
            console.log("y1: " + y1)
            console.log("y2: " + y2)
        }

    };


    //react hooks



    useEffect(() => {
        if (isWeb3Enabled) {
            console.log("loading")
            updateAll().then(() => console.log("loaded"))
        }
    }, [isWeb3Enabled, pointerPosition.x, pointerPosition.y, tokenId, isMinted, account])

    useEffect(() => {
        if (isWeb3Enabled) {
            updateAll()
        }
    }, [])

    useEffect(() => {
        getPosition();
    }, [pointerPosition.x, pointerPosition.y]);

    // Re-calculate X and Y of the red box when the window is resized by the user
    useEffect(() => {
        window.addEventListener("resize", getPosition);
    }, []);



    const mintSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Successfully Minted!",
            title: "Mint Pixel",
            position: "topR",
        })
    }

    const mintErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Mint Failed! Reason: " + errMsg,
            title: "Mint Pixel",
            position: "topR",
        })
    }

    const handleMintSuccess = async () => {
        console.log("triggered success")
        updateAll()
        mintSuccessNotification()
        setIsMinting(false)
    }
    const handleMintError = async (err) => {
        console.log("triggered error")
        updateAll()
        mintErrorNotification(err)
        setIsMinting(false)
    }







    return (
        <div style={{
            position: 'absolute', left: 0, top: 0, height: '100vh', width: '25vw', backgroundColor: 'white',
        }}>
            <ColorPickerModal selectedColor={selectedColor} setSelectedColor={setSelectedColor} setOpenColorPicker={setOpenColorPicker} openColorPicker={openColorPicker} />

            <div style={{ padding: '1em' }}>
                <button className="block ml-auto text-5xl leading-3" onClick={onSidebarCancel}>&times;</button>
            </div>






            {(nftAddress && mainframeAddress) ? (
                <div>
                    <div>
                        <div
                            style={{
                                height: '25px',
                                transform: 'scale(1)'
                            }}
                        >
                            <BannerStrip
                                text="Prices displayed are in MATIC"
                                type="standard"
                            />
                        </div>
                        <div className="m-4">
                            <Information
                                information={
                                    <div className="relative">
                                        <div className="inline-block mr-3">
                                            <CryptoLogos
                                                chain="polygon"
                                                size="48px"
                                            />
                                        </div>

                                        <span className="absolute top-1/2 transform -translate-y-1/2">
                                            {ethers.utils.formatEther(BigNumber.from(mintingFee))}

                                        </span>




                                    </div>

                                }
                                topic="Pixel Price"
                            />
                        </div>
                    </div>
                    <div ref={ref1} className="noscrollbar" style={{ maxHeight: (y1 && y2) ? y2 - y1 : '60vh', overflowX: "hidden", overflowY: "scroll" }}>
                        {(isMinted) ? (
                            <Lottery account={account} fee={mintingFee} nftAddress={nftAddress} mainframeAddress={mainframeAddress} abiPixelMainframe={abiMain} abiPixelNFT={abiNFT} color={color} tokenId={tokenId} />


                        ) : <>

                            <MintInstruction />


                        </>}
                        {(isMinted) ? <ChangeColor account={account} nftAddress={nftAddress} abiPixelNFT={abiNFT} color={color} tokenId={tokenId} />
                            : null}
                    </div>
                    <div ref={ref2} className="bg-color-web3" style={{ position: 'absolute', bottom: 0, width: '100%', padding: '1em' }}>
                        {(isMinted) ?


                            <PixelState color={color} X={pointerPosition.x} Y={pointerPosition.y} tokenId={tokenId} />

                            :

                            <>
                                <button onClick={() => setOpenColorPicker(true)} className="border-slate-300 border inline-block" style={{ width: '40px', height: '40px', backgroundColor: selectedColor }}></button>
                                <div className="inline-block mx-5" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
                                    <span className="text-2xl">
                                        ({pointerPosition.x} , {pointerPosition.y})
                                    </span>
                                </div>








                                <div className="float-right">
                                    <Button
                                        id="mint-button"
                                        onClick={async () => {
                                            console.log(mintingFee)
                                            setIsMinting(true)
                                            await mintNFT({
                                                // onComplete:
                                                onError: (err) => handleMintError(err.message),
                                                onSuccess: (tx) => tx.wait().then(() => {
                                                    handleMintSuccess()
                                                })
                                            })
                                        }
                                        }
                                        disabled={mintNFTIsFetching || mintNFTIsLoading || isMinting}
                                        size="large"
                                        text={mintNFTIsFetching || mintNFTIsLoading || isMinting ? (
                                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                        ) : (
                                            'Mint'

                                        )}
                                        theme="primary"
                                        type="button"
                                    />
                                </div>


                                {/*<button
                                className="bg-blue-500 hover:bg-blue-700 text-white text-lg font-bold py-2 px-4 rounded-full float-right"
                                onClick={async () => {
                                    console.log(mintingFee)
                                    setIsMinting(true)
                                    await mintNFT({
                                        // onComplete:
                                        onError: (err) => handleMintError(err.message),
                                        onSuccess: (tx) => tx.wait().then(() => {
                                            handleMintSuccess()
                                        })
                                    })
                                }
                                }
                                disabled={mintNFTIsFetching || mintNFTIsLoading || isMinting}
                            >
                                
                            </button>*/}



                            </>


                        }
                    </div>
                </div>

            ) : null

            }

        </div >
    )
}

export default Sidebar