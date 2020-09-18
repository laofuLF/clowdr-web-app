import React from "react";
import { Picker } from 'emoji-mart'
import { AuthUserContext } from "../Session";
import { ClowdrState } from "../../ClowdrTypes";

interface EmojiPickerPopoverProps {
    appState: ClowdrState | null;
    theme: string | null;
}

interface EmojiPickerPopoverState {}

class EmojiPickerPopover extends React.Component<EmojiPickerPopoverProps, EmojiPickerPopoverState>{
    private pickerRef: React.RefObject<any>;
    constructor(props: EmojiPickerPopoverProps) {
        super(props);
        this.state = {
        }
        this.pickerRef = React.createRef();
    }
    componentDidMount(): void {
        this.props.appState?.chatClient.initEmojiPicker(this.pickerRef);
    }

    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        return <div id="messageReactionPicker" style={{ top: "10px", display: "none" }} ref={this.pickerRef}>
            {<Picker set='google' theme={this.props.theme === "dark" ? "dark" : "light"} onSelect={this.props.appState?.chatClient.emojiSelected.bind(this.props.appState?.chatClient)} title="Pick a reaction" />}
        </div>
    }
}

const AuthConsumer = (props: any) => (
    <AuthUserContext.Consumer>
        {value => (
            <EmojiPickerPopover {...props} appState={value} />
        )}
    </AuthUserContext.Consumer>

);
export default AuthConsumer;
