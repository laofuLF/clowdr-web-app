import React from "react";
import { Picker } from 'emoji-mart'
import { AuthUserContext } from "../Session";
import { ClowdrState } from "../../ClowdrTypes";

interface EmojiPickerPopoverProps {
    appState: ClowdrState | null;
}
interface EmojiPickerPopoverState {
    theme: string | null;
}
class EmojiPickerPopover extends React.Component<EmojiPickerPopoverProps, EmojiPickerPopoverState>{
    private pickerRef: React.RefObject<any>;
    constructor(props: EmojiPickerPopoverProps) {
        super(props);
        this.state = {
            theme: window.localStorage.getItem("theme") === "0" ? "light" : window.localStorage.getItem("theme")
        }
        this.pickerRef = React.createRef();
    }
    componentDidMount(): void {
        this.props.appState?.chatClient.initEmojiPicker(this.pickerRef);
    }

    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        return <div id="messageReactionPicker" style={{ top: "10px", display: "none" }} ref={this.pickerRef}>
            {this.state.theme === 'dark' ? <Picker set='google' theme='dark' onSelect={this.props.appState?.chatClient.emojiSelected.bind(this.props.appState?.chatClient)} title="Pick a reaction" /> :
                <Picker set='google' theme='light' onSelect={this.props.appState?.chatClient.emojiSelected.bind(this.props.appState?.chatClient)} title="Pick a reaction" />}
        </div>
    }
}

const AuthConsumer = () => (
    <AuthUserContext.Consumer>
        {value => (
            <EmojiPickerPopover appState={value} />
        )}
    </AuthUserContext.Consumer>

);
export default AuthConsumer;
