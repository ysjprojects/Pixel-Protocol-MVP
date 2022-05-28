import { Information, CryptoLogos } from "web3uikit"
import { BigNumber, ethers } from "ethers"




const EarningsDisplay = ({ totalReward, pixelReward }) => {

    return (<div className="grid grid-cols-2 gap-x-2 py-4">
        <div>
            <Information
                information={
                    <div className="relative">
                        <div className="inline-block mr-3">
                            <CryptoLogos
                                chain="polygon"
                                size="24px"
                            />
                        </div>

                        <span className="absolute top-1/2 transform -translate-y-1/2">
                            {Number(ethers.utils.formatEther(BigNumber.from(totalReward))).toPrecision(4)}

                        </span>




                    </div>


                }
                topic="Total Earnings"
            />
        </div>
        <div>
            <Information
                information={
                    <div className="relative">
                        <div className="inline-block mr-3">
                            <CryptoLogos
                                chain="polygon"
                                size="24px"
                            />
                        </div>

                        <span className="absolute top-1/2 transform -translate-y-1/2">
                            {Number(ethers.utils.formatEther(BigNumber.from(pixelReward))).toPrecision(4)}

                        </span>




                    </div>

                }
                topic="Earnings from Pixel"
            />
        </div>



    </div>)
}

export default EarningsDisplay;