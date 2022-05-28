import { useState, useEffect } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { BigNumber } from "ethers"
import abiNFT from '../constants/abiPixelNFT.json'
import { Card, Illustration } from "web3uikit";
import OwnerUI from "./lottery/OwnerUI";
import PlayerUI from "./lottery/PlayerUI";

const Lottery = ({ account, fee, nftAddress, mainframeAddress, abiPixelNFT, abiPixelMainframe, color, tokenId }) => {


    const [isOwnerOrPrevOwner, setIsOwnerOrPrevOwner] = useState(false);






    const { runContractFunction: getOwner
    } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: 'ownerOf',
        params: {
            tokenId: BigNumber.from(tokenId)
        }

    })

    const { runContractFunction: getPrevOwner
    } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: nftAddress,
        functionName: 'getPrevOwner',
        params: {
            _tokenId: BigNumber.from(tokenId)
        }

    })

    async function updateIsOwnerOrPrevOwner() {
        const ownerFromCall = (tokenId === "0") ? "0" : (await getOwner() as string).toLowerCase()
        const prevOwnerFromCall = (tokenId === "0") ? "0" : (await getPrevOwner() as string).toLowerCase()



        const isOwner = (ownerFromCall === account) || (prevOwnerFromCall === account);
        setIsOwnerOrPrevOwner(isOwner);

    }

    useEffect(() => {
        updateIsOwnerOrPrevOwner()
    }, [tokenId, account])
    useEffect(() => {
        updateIsOwnerOrPrevOwner()
    }, [])







    return (
        <div className="m-4"

        >
            <Card
                onClick={function noRefCheck() { }}
                setIsSelected={function noRefCheck() { }}
                tooltipText={<span style={{ width: 150 }}>{(isOwnerOrPrevOwner) ? "Stake Pixel in lottery contract to earn fees" : "Participate in lottery to win pixels"}</span>}
            >
                <div>
                    <Illustration
                        height="180px"
                        logo="chest"
                        width="100%"
                    />

                </div>
                <div className="mt-5">
                    {isOwnerOrPrevOwner}
                    {
                        (isOwnerOrPrevOwner) ? <OwnerUI
                            account={account}
                            nftAddress={nftAddress}
                            mainframeAddress={mainframeAddress}
                            abiPixelMainframe={abiPixelMainframe}
                            abiPixelNFT={abiPixelNFT}
                            color={color}
                            tokenId={tokenId}
                            fee={fee} /> : <PlayerUI
                            account={account}
                            nftAddress={nftAddress}
                            mainframeAddress={mainframeAddress}
                            abiPixelMainframe={abiPixelMainframe}
                            abiPixelNFT={abiPixelNFT}
                            color={color}
                            tokenId={tokenId}
                            fee={fee}
                            setIsOwnerOrPrevOwner={setIsOwnerOrPrevOwner} />

                    }
                </div>
            </Card>
        </div>
    )
}

export default Lottery