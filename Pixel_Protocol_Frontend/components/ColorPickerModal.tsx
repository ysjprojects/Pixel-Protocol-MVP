import { ColorPicker, toColor, useColor } from "react-color-palette";
import "react-color-palette/lib/css/styles.css";
import { useEffect, useState } from "react";
import { Modal } from "web3uikit";


const ColorPickerModal = ({ selectedColor, setSelectedColor, openColorPicker, setOpenColorPicker }) => {
    const [color, setColor] = useColor("hex", selectedColor)
    const [isVisible, setIsVisible] = useState(openColorPicker)



    const updateColor = () => {
        setSelectedColor(color.hex)
    }

    const closeModal = () => {
        setIsVisible(false)
    }

    useEffect(() => {
        setIsVisible(openColorPicker)
        setColor(toColor("hex", selectedColor))
    }, [openColorPicker, selectedColor])

    return (
        <Modal
            id="v-center"
            isCentered
            isVisible={isVisible}
            cancelText="Discard Changes"
            okText="Save Changes"
            width="664px"

            onOk={() => { updateColor(); closeModal(); setOpenColorPicker(false) }
            }
            onCancel={() => { closeModal(); setOpenColorPicker(false) }}
            onCloseButtonPressed={() => { closeModal(); setOpenColorPicker(false) }}

        >
            <ColorPicker width={600} height={400} color={color} onChange={setColor} hideHSV />

        </Modal>
    )
}

export default ColorPickerModal;
