import { useState, useEffect } from "react";
import { useWeb3Contract, } from "react-moralis";
import { useNotification } from "web3uikit"
import { BigNumber } from "ethers"
import { Button } from "web3uikit";

import EarningsDisplay from "./EarningsDisplay";


const StakingInstruction = () => {
    return (<div className="text-color-web3 text-center m-8">
        <h3 className="font-bold">Stake to Earn</h3>
        <p>1. Click on the 'Approve' button to approve the Pixel.</p>
        <p>2. Once approved, stake by clicking on the 'Stake' button.</p>
        <p>3. Click on the 'Unstake' button to unstake your Pixel at any time.</p>


    </div>)
}



const OwnerUI = ({ account, nftAddress, mainframeAddress, abiPixelMainframe, abiPixelNFT, color, tokenId, fee }) => {


    const [isApproved, setIsApproved] = useState(false)
    const [isStaked, setIsStaked] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [isStaking, setIsStaking] = useState(false)
    const [isUnstaking, setIsUnstaking] = useState(false)
    const [pixelReward, setPixelReward] = useState("0")
    const [totalReward, setTotalReward] = useState("0")


    const dispatch = useNotification();

    //getters

    const { runContractFunction: getApproved } = useWeb3Contract({
        abi: abiPixelNFT,
        contractAddress: nftAddress,
        functionName: "getApproved",
        params: {
            tokenId: tokenId
        }
    })

    const { runContractFunction: pixelIsStaked } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "isStaked",
        params: {
            _tokenId: BigNumber.from(tokenId)
        }
    })

    const { runContractFunction: getTotalReward } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "getTotalReward",
        params: {
            _account: account
        }
    })
    const { runContractFunction: getPixelReward } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "getPixelReward",
        params: {
            _account: account,
            _tokenId: BigNumber.from(tokenId)
        }
    })




    const { runContractFunction: stake,
        isLoading: stakeIsLoading,
        isFetching: stakeIsFetching
    } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "stakePixel",
        params: {
            _tokenId: tokenId
        }
    })

    const { runContractFunction: unstake,
        isLoading: unstakeIsLoading,
        isFetching: unstakeIsFetching
    } = useWeb3Contract({
        abi: abiPixelMainframe,
        contractAddress: mainframeAddress,
        functionName: "unstakePixel",
        params: {
            _tokenId: tokenId
        }
    })




    const {
        runContractFunction: approve,
        isLoading: approveIsLoading,
        isFetching: approveIsFetching,
    } = useWeb3Contract({
        abi: abiPixelNFT,
        contractAddress: nftAddress,
        functionName: "approve",
        params: {
            to: mainframeAddress,
            tokenId: tokenId
        }
    })


    const approveSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Successfully Approved!",
            title: "Approve Lottery Contract",
            position: "topR",
        })
    }

    const approveErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Approve failed! Reason: " + errMsg,
            title: "Approve Lottery Contract",
            position: "topR",
        })
    }


    const handleApproveSuccess = async () => {
        console.log("triggered success")
        updateIsApproved()
        approveSuccessNotification()
        setIsApproving(false)
    }
    const handleApproveError = async (err) => {
        console.log("triggered error")
        updateIsApproved()
        approveErrorNotification(err)
        setIsApproving(false)
    }

    const stakeSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Sucessfully Staked!",
            title: "Stake Pixel",
            position: "topR",
        })
    }

    const stakeErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Stake Failed! Reason: " + errMsg,
            title: "Stake Pixel",
            position: "topR",
        })
    }


    const handleStakeSuccess = async () => {
        console.log("triggered success")
        updateIsStaked()
        stakeSuccessNotification()
        setIsStaking(false)
    }
    const handleStakeError = async (err) => {
        console.log("triggered error")
        updateIsStaked()
        stakeErrorNotification(err)
        setIsStaking(false)
    }

    const unstakeSuccessNotification = () => {
        dispatch({
            type: "success",
            message: "Successfully Unstaked!",
            title: "Unstake Pixel",
            position: "topR",
        })
    }

    const unstakeErrorNotification = (errMsg: string) => {
        dispatch({
            type: "error",
            message: "Unstake Failed! Reason: " + errMsg,
            title: "Unstake Pixel",
            position: "topR",
        })
    }


    const handleUnstakeSuccess = async () => {
        console.log("triggered success")
        updateIsStaked()
        unstakeSuccessNotification()
        setIsUnstaking(false)
    }
    const handleUnstakeError = async (err) => {
        console.log("triggered error")
        updateIsStaked()
        unstakeErrorNotification(err)
        setIsUnstaking(false)
    }

    async function updateIsStaked() {
        const isStakedFromCall = await pixelIsStaked() as boolean
        setIsStaked(isStakedFromCall)
    }

    async function updateIsApproved() {
        const approvedAddress = (tokenId === "0") ? "0" : (await getApproved() as string).toLowerCase()
        const approved = approvedAddress === (mainframeAddress as string).toLowerCase()
        setIsApproved(approved)
    }

    async function updateRewards() {
        const totalRewardFromCall = (await getTotalReward() as BigNumber).toString()
        const pixelRewardFromCall = (await getPixelReward() as BigNumber).toString()
        setTotalReward(totalRewardFromCall)
        setPixelReward(pixelRewardFromCall)

    }

    function updateAll() {
        updateIsStaked()
        updateIsApproved()
        updateRewards()
    }

    useEffect(() => {
        updateAll()
    }, [tokenId, account])


    return (
        <>

            <EarningsDisplay totalReward={totalReward} pixelReward={pixelReward} />
            <StakingInstruction />
            <div className="float-right">
                {(isStaked) ? (
                    <>
                        <div className="inline-block">
                            <Button
                                id="unstake-button"
                                onClick={async () => {
                                    setIsUnstaking(true)
                                    await unstake({
                                        onError: (err) => handleUnstakeError(err.message),
                                        onSuccess: (tx) => tx.wait().then(() => {
                                            handleUnstakeSuccess()
                                        })
                                    })
                                }}
                                text="Unstake"
                                size="large"
                                theme="primary"
                                type="button"
                                disabled={unstakeIsLoading || unstakeIsFetching || isUnstaking}

                            />

                        </div>
                    </>
                ) : (
                    <>
                        <div className="inline-block">
                            <Button
                                id="approve-button"
                                onClick={async () => {
                                    setIsApproving(true)
                                    await approve({
                                        onError: (err) => handleApproveError(err.message),
                                        onSuccess: (tx) => tx.wait().then(() => {
                                            handleApproveSuccess()
                                        })
                                    })
                                }}
                                text="Approve"
                                size="large"
                                theme="secondary"
                                type="button"
                                disabled={isApproved || approveIsLoading || approveIsFetching || isApproving}
                            />

                        </div>
                        <div className="inline-block pl-2"></div>
                        <div className="inline-block"><Button
                            id="stake-button"
                            onClick={async () => {
                                setIsStaking(true)
                                await stake({
                                    onError: (err) => handleStakeError(err.message),
                                    onSuccess: (tx) => tx.wait().then(() => {
                                        handleStakeSuccess()
                                    })
                                })
                            }}
                            text="Stake"
                            size="large"
                            theme="primary"
                            type="button"
                            disabled={!isApproved || stakeIsLoading || stakeIsFetching || isStaking}
                        /></div>
                    </>
                )}


            </div>
        </>


    )
}

export default OwnerUI