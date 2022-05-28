import { useState, useEffect } from "react";
import { useWeb3Contract } from "react-moralis";
import { useNotification } from "web3uikit"
import { BigNumber } from "ethers"
import ColorPickerModal from "./ColorPickerModal";
import { Information, Button, Icon } from "web3uikit";

const ChangeColor = ({ account, nftAddress, abiPixelNFT, color, tokenId }) => {
    const [isOwner, setIsOwner] = useState(false);
    const [selectedColor, setSelectedColor] = useState(color);
    const [openColorPicker, setOpenColorPicker] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    const dispatch = useNotification();

    const { runContractFunction: getOwner } = useWeb3Contract({
        abi: abiPixelNFT,
        contractAddress: nftAddress,
        functionName: "ownerOf",
        params: {
            tokenId: BigNumber.from(tokenId)
        }
    })

    const { runContractFunction: changeColor, isFetching: changeColorIsFetching, isLoading: changeColorIsLoading } = useWeb3Contract({
        abi: abiPixelNFT,
        contractAddress: nftAddress,
        functionName: "setTokenColor",
        params: {
            _tokenId: BigNumber.from(tokenId),
            _colorCode: "0x" + selectedColor.substring(1)
        }
    })




    async function updateIsOwner() {
        const owner = (tokenId === "0") ? "0" : (await getOwner() as string).toLowerCase();

        setIsOwner(owner === account)
    }

    useEffect(() => {
        updateIsOwner();
        setSelectedColor(color);
    }, [tokenId, account, color])

    const changeColorSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Color Changed!",
            title: "Update Pixel",
            position: "topR",
        })
    }

    const changeColorErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Color Change Failed! Reason: " + errMsg,
            title: "Update Pixel",
            position: "topR",
        })
    }

    const handleChangeColorSuccess = async () => {
        updateIsOwner()
        changeColorSuccessNotification()
        setIsChanging(false)
    }
    const handleChangeColorError = async (err) => {
        updateIsOwner()
        changeColorErrorNotification(err)
        setIsChanging(false)
    }



    return (
        (isOwner) ? (
            <>
                <ColorPickerModal selectedColor={selectedColor} setSelectedColor={setSelectedColor} setOpenColorPicker={setOpenColorPicker} openColorPicker={openColorPicker} />

                < div className="m-4">
                    <Information
                        information={
                            <>
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
                                <div className="float-right">
                                    <Button
                                        id="change-color-button"
                                        onClick={async () => {
                                            setIsChanging(true)
                                            await changeColor({
                                                // onComplete:
                                                onError: (err) => handleChangeColorError(err.message),
                                                onSuccess: (tx) => tx.wait().then(() => {
                                                    handleChangeColorSuccess()
                                                })
                                            })
                                        }
                                        }
                                        disabled={changeColorIsFetching || changeColorIsLoading || isChanging || (selectedColor === color)}
                                        size="large"
                                        text={changeColorIsFetching || changeColorIsLoading || isChanging ? (
                                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                        ) : (
                                            'Change Color'

                                        )}
                                        theme="primary"
                                        type="button"
                                    />
                                </div>
                            </>


                        }
                        topic="Change Pixel Color"
                    />
                </div>

            </>) : null
    )
}
export default ChangeColor;