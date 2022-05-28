import { Card, Illustration } from "web3uikit"


const MintInstruction = () => {
    return (
        <div className="m-4">

            <Card
                description={<div className="m-8">
                    <p>1. Double check the price and coordinates of the Pixel.</p>
                    <p>2. Select color of the pixel using the color picker at the bottom left.</p>
                    <p>3. Click on "Mint" button to buy the Pixel.</p>
                </div>}
                onClick={function noRefCheck() { }}
                title="Buy Pixel"
            >
                <div>
                    <Illustration
                        height="180px"
                        logo="marketplace"
                        width="100%"
                    />
                </div>
            </Card >
        </div >
    )
}


export default MintInstruction