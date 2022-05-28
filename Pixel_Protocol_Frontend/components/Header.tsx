
import { ConnectButton } from "web3uikit"
import Image from "next/image"

const Header = () => {
    return (
        <>
            <div className="fixed p-4">
                <div /*onClick={() => window.location.href = '/about'}*/ style={{ width: 70, height: 70, filter: 'drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.5))', border: '3px solid white !important' }}>
                    <Image id="navLogo" src="/logo.png" alt="logo" width="64" height="64" />

                </div>
            </div>
            <div className="fixed right-0 p-4">
                <ConnectButton moralisAuth={false} />
            </div>

        </>

    )
}

export default Header