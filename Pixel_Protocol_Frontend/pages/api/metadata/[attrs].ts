// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<Number[]>
) {
    const { attrs } = req.query;
    const [tokenId, X, Y, colorCode] = (attrs as string).split("-")
    res.end({
        id: tokenId,
        x: X,
        y: Y,
        color: "#" + colorCode.toLowerCase().substring(2)
    })

}
