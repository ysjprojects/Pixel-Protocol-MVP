import { useState, useEffect } from "react";
import { useWeb3Contract } from "react-moralis";
import { useNotification } from "web3uikit"
import { BigNumber } from "ethers"
import ColorPickerModal from "../ColorPickerModal";
import { Information, Button, Icon } from "web3uikit";
import BattleModal from "./BattleModal";

const LotteryInstruction = () => {
    return (<div className="text-color-web3 text-center m-8">
        <h3 className="font-bold">Enter Lottery</h3>
        <p>1. Select the color that you intend to use to update the Pixel.</p>
        <p>2. Click on the 'Battle' button to bid for the Pixel.</p>
        <p>3. On winning, the Pixel will be transferred to your wallet.</p>


    </div>)
}




const PlayerUI = ({ account, nftAddress, mainframeAddress, abiPixelMainframe, abiPixelNFT, color, tokenId, fee, setIsOwnerOrPrevOwner }) => {
    const [isStaked, setIsStaked] = useState(false)
    const [isBattling, setIsBattling] = useState(false)
    const [selectedColor, setSelectedColor] = useState(color)
    const [openColorPicker, setOpenColorPicker] = useState(false)
    const [openBattleModal, setOpenBattleModal] = useState(false)
    const [prevOwner, setPrevOwner] = useState("0")

    const dispatch = useNotification()

    const { runContractFunction: pixelIsStaked } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "isStaked",
        params: {
            _tokenId: BigNumber.from(tokenId)
        }
    })

    const { runContractFunction: getPrevOwner } = useWeb3Contract({
        abi: abiPixelNFT,
        contractAddress: nftAddress,
        functionName: "getPrevOwner",
        params: {
            _tokenId: BigNumber.from(tokenId)
        }
    })



    const { runContractFunction: battle,
        isLoading: battleIsLoading,
        isFetching: battleIsFetching } = useWeb3Contract({
            abi: abiPixelMainframe,
            contractAddress: mainframeAddress,
            functionName: "battle",
            msgValue: fee,
            params: {
                _tokenId: tokenId,
                _colorCode: parseInt("0x" + selectedColor.substring(1), 16)
            }

        })
    const battleSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Battle Request Sent!",
            title: "Battle Pixel",
            position: "topR",
        })
    }

    const battleErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Battle Request Failed! Reason: " + errMsg,
            title: "Battle Pixel",
            position: "topR",
        })
    }




    const handleBattleSuccess = async () => {
        setOpenBattleModal(true)
        updateIsStaked()
        battleSuccessNotification()
    }
    const handleBattleError = async (err) => {
        console.log("triggered error")
        updateIsStaked()
        battleErrorNotification(err)
        setIsBattling(false)
    }



    async function updateIsStaked() {
        const isStakedFromCall = (tokenId === "0") ? false : await pixelIsStaked() as boolean
        setIsStaked(isStakedFromCall)
    }

    async function updatePrevOwner() {
        const prevOwner = (tokenId === "0") ? "0" : (await getPrevOwner() as string).toLowerCase()
        setPrevOwner(prevOwner)
    }


    useEffect(() => {
        updateIsStaked()
        updatePrevOwner()
    }, [tokenId, isBattling, account])

    useEffect(() => {
        setSelectedColor(color)
    }, [color])

    return (
        <>
            <ColorPickerModal selectedColor={selectedColor} setSelectedColor={setSelectedColor} setOpenColorPicker={setOpenColorPicker} openColorPicker={openColorPicker} />


            <BattleModal mainframeAddress={mainframeAddress} abiPixelMainframe={abiPixelMainframe} prevOwner={prevOwner} account={account} tokenId={tokenId} setOpenBattleModal={setOpenBattleModal} openBattleModal={openBattleModal} setIsBattling={setIsBattling} setIsOwnerOrPrevOwner={setIsOwnerOrPrevOwner} />




            {(isStaked) ? (
                <>
                    <LotteryInstruction />
                    < div className="my-4">
                        <Information
                            information={
                                <div className="justify-center flex">
                                    <div className="my-4 inline-block">

                                        <button disabled className="border-slate-300 border inline-block" style={{ width: '60px', height: '60px', backgroundColor: color }}></button>

                                        <div className="inline-block"><Icon
                                            fill="#2E7DAF"
                                            size={60}
                                            svg="chevronRightX2"
                                        /></div>

                                        <button onClick={() => setOpenColorPicker(true)} className="border-slate-300 border inline-block" style={{ width: '60px', height: '60px', backgroundColor: selectedColor }}></button>



                                    </div>
                                </div>

                            }
                            topic="Select Pixel Color"
                        />
                    </div></>) : <div className="text-center text-color-web3 p-4">Battle Unavailable: Pixel has not been staked.</div>
            }



            <Button
                id="battle-button"
                onClick={async () => {
                    setIsBattling(true)
                    await battle({
                        onError: (err) => handleBattleError(err.message),
                        onSuccess: (tx) => tx.wait().then(() => {
                            handleBattleSuccess()
                        })
                    })
                }}
                text="Battle"
                size="large"
                theme="primary"
                type="button"
                isFullWidth
                disabled={!isStaked || isBattling || battleIsFetching || battleIsLoading}
            />


        </>
    )



}


export default PlayerUI