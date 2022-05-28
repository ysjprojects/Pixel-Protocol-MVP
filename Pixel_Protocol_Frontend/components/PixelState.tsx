interface PixelStateProps {
    color: string,
    tokenId: string,
    X: number,
    Y: number
}


const PixelState = ({ color, tokenId, X, Y }: PixelStateProps) => {




    return (
        <>
            <div className="border-slate-300 border inline-block" style={{ width: '40px', height: '40px', backgroundColor: color }}></div>

            <div className="inline-block mx-5" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
                <span className="text-2xl text-white">
                    ({X} , {Y}) , #{tokenId}
                </span>
            </div>


        </>
    )
}
export default PixelState;