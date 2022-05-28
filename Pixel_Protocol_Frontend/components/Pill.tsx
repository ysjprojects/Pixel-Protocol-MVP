import { useState } from 'react'
import { Button, Input } from "web3uikit"
import { Coordinates } from '../types';


interface PillProps {
    pointerPosition: Coordinates,
    cameraZoom: number,
    moveToPoint: (x: number, y: number) => void
}

const Pill = ({ pointerPosition, cameraZoom, moveToPoint }: PillProps) => {
    const [isSearchMode, setSearchMode] = useState(false);
    const [searchInputs, setSearchInputs] = useState({ x: 0, y: 0 })

    const onToggleSearch = () => {
        setSearchInputs({ x: pointerPosition ? pointerPosition.x : 0, y: pointerPosition ? pointerPosition.y : 0 });
        setSearchMode(true);
    }

    const onInputXChange = (e) => {
        if (isNaN(e.target.value)) return;
        if (!Number.isInteger(Number(e.target.value))) return;

        setSearchInputs(pInput => { return { x: e.target.value, y: pInput.y } });
    }

    const onInputYChange = (e) => {
        if (isNaN(e.target.value)) return;
        if (!Number.isInteger(Number(e.target.value))) return;

        setSearchInputs(pInput => { return { x: pInput.x, y: e.target.value } });
    }

    const onSearch = (e) => {
        e.preventDefault();
        moveToPoint(searchInputs.x, searchInputs.y);
        setSearchMode(false);
    }

    const Coordinates = <>
        <div style={{ alignSelf: 'center ' }}>({pointerPosition ? pointerPosition.x : -1} , {pointerPosition ? pointerPosition.y : -1}) : {cameraZoom.toFixed(2)}x </div>
        <Button style={{ marginLeft: '1em' }} onClick={onToggleSearch} icon="search" iconLayout="icon-only" />
    </>

    const SearchBar = <>
        <form style={{ display: 'flex', flexDirection: 'row', gap: '0.5em', alignItems: 'center' }}>
            <Input id="x" name="x" width="3em" autoComplete={false} customInput={<input type="text" inputMode="numeric" value={searchInputs.x} onChange={onInputXChange} style={{ backgroundColor: 'transparent', width: '3em', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }} />} />
            <Input id="y" name="y" width="3em" autoComplete={false} customInput={<input type="text" inputMode="numeric" value={searchInputs.y} onChange={onInputYChange} style={{ backgroundColor: 'transparent', width: '3em', outline: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }} />} />
            <Button type="submit" onClick={onSearch} icon="search" iconLayout="icon-only" />
        </form>
        <Button onClick={() => { setSearchMode(false) }} text="Cancel" icon="x" iconLayout="icon-only" style={{ marginLeft: '0.5em', alignSelf: 'center' }} />
    </>

    return (
        <div className="rounded-full font-semibold text-md bg-cyan-500 text-white py-2 px-4" style={{
            position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', border: '3px solid white', filter: 'drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.3))',
            display: 'flex', flexDirection: 'row'
        }}>
            {isSearchMode ? SearchBar : Coordinates}
        </div>
    )
}

export default Pill;