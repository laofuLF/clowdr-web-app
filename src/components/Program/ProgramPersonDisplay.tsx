import React from "react";
import {Skeleton, Tooltip} from "antd";
import UserStatusDisplay from "../Lobby/UserStatusDisplay";
import {ClowdrState} from "../../ClowdrTypes";
import Parse from "parse";

interface ProgramPersonDisplayProps {
    auth: ClowdrState | null;
    id: string;
}

interface ProgramPersonDisplayState {
    ProgramPerson?: any; // TS: type of person?
}

export default class ProgramPersonDisplay extends React.Component<ProgramPersonDisplayProps, ProgramPersonDisplayState> {
    constructor(props: ProgramPersonDisplayProps) {
        super(props);
        this.state ={};
    }
    async componentDidMount() {
        let person = await this.props.auth?.programCache.getProgramPersonByID(this.props.id, this);
        this.setState({ProgramPerson: person});
    }
    componentWillUnmount() {
        this.props.auth?.programCache.cancelSubscription("ProgramPerson", this, this.props.id);
    }

    render() {
        if(!this.state.ProgramPerson){
            return <Skeleton.Input />
        }
        if(this.state.ProgramPerson.get("userProfile")){
            return <UserStatusDisplay profileID={this.state.ProgramPerson.get("userProfile").id} inline={true} />
        }
        return <Tooltip title={this.state.ProgramPerson.get("name") + " has not yet linked their CLOWDR and author records. To link these records, please go to 'My Account'."}><span className="programPerson">{this.state.ProgramPerson.get("name")}</span></Tooltip>
    }
};