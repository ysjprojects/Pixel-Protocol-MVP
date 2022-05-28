import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { BigNumber, ethers } from "ethers"
import { Modal } from "web3uikit";

const BattleModal = ({ mainframeAddress, abiPixelMainframe, prevOwner, account, tokenId, openBattleModal, setOpenBattleModal, setIsBattling, setIsOwnerOrPrevOwner }) => {


    const { provider } = useMoralis()

    const ethersProvider = new ethers.providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const [isVisible, setIsVisible] = useState(openBattleModal)
    const [status, setStatus] = useState(0) // 0: pending; 1: win; 2: lost

    const cPixelMainframe = new ethers.Contract(mainframeAddress, abiPixelMainframe, signer);


    const listenToEvents = async () => {
        const startBlockNumber = await ethersProvider.getBlockNumber();
        console.log("Start block number: " + startBlockNumber)
        cPixelMainframe.on("BattleWon", (prevAddr: string, newAddr: string, id: BigNumber, event) => {
            console.log(prevAddr)
            console.log(newAddr)
            console.log(id)
            console.log(event.blockNumber)
            if (prevAddr.toLowerCase() === prevOwner.toLowerCase()
                && newAddr.toLowerCase() === account.toLowerCase()
                && id.toString() === tokenId
                && event.blockNumber > startBlockNumber)
                setStatus(1)
        })

        cPixelMainframe.on("BattleLost", (prevAddr: string, newAddr: string, id: BigNumber, event) => {
            console.log(prevAddr)
            console.log(newAddr)
            console.log(id)
            console.log(event.blockNumber)
            console.log(event.blockNumber > startBlockNumber)

            if (prevAddr.toLowerCase() === prevOwner.toLowerCase()
                && newAddr.toLowerCase() === account.toLowerCase()
                && id.toString() === tokenId
                && event.blockNumber > startBlockNumber)
                setStatus(2)
        })

    }






    const closeModal = () => {
        setIsVisible(false)
    }

    useEffect(() => {
        setIsVisible(openBattleModal)
        if (openBattleModal) {
            listenToEvents()
        } else {
            setStatus(0)
        }
    }, [openBattleModal])


    useEffect(() => {
        if (status === 1) {
            setIsOwnerOrPrevOwner(true)
        }
    }, [status])

    return (
        <Modal
            id="v-center"

            isCentered
            isVisible={isVisible}
            isOkDisabled={status === 0}
            hasCancel={false}
            okText="Close"
            width="664px"
            onOk={() => { closeModal(); setOpenBattleModal(false); setIsBattling(false) }
            }
            onCloseButtonPressed={() => { }}
            closeButton={<span id="close"></span>}
        >
            <div>
                {(status === 0) ? "Battle in progress" : "Battle completed!"}
                {(status === 1) ? "Battle Won :)" : null}
                {(status === 2) ? "Battle Lost :(" : null}

            </div>
        </Modal>



    )
}

export default BattleModal;
