import React from "react";
import {Skeleton, Tooltip} from "antd";
import UserStatusDisplay from "../Lobby/UserStatusDisplay";
import ProgramItemDisplay from "./ProgramItemDisplay";
import {ClowdrState} from "../../ClowdrTypes";

interface ProgramPersonAuthorshipProps {
    auth: ClowdrState | null;
    id: string;
}

interface ProgramPersonAuthorshipState {
    ProgramPerson?: any; // TS: type of person?
}

export default class ProgramPersonAuthorship extends React.Component<ProgramPersonAuthorshipProps, ProgramPersonAuthorshipState> {
    constructor(props: ProgramPersonAuthorshipProps) {
        super(props);
        this.state ={};
    }
    async componentDidMount() {
        let person = await this.props.auth?.programCache.getProgramPersonByID(this.props.id,this);
        this.setState({ProgramPerson: person});
    }
    componentWillUnmount() {
        this.props.auth?.programCache.cancelSubscription("ProgramPerson", this, this.props.id);
    }

    render() {
        if(!this.state.ProgramPerson){
            return <Skeleton.Input />
        }
        let items: any[] = [];
        if (this.state.ProgramPerson.get("programItems"))
            for (let item of this.state.ProgramPerson.get("programItems")) {
                items.push(<li key={item.id}><ProgramItemDisplay id={item.id} auth={this.props.auth} showBreakoutRoom={false}/></li>) // TS: should showBreakoutRoom be false?
            }
        if(items.length === 0)
            items = ["(No items)"]; // TS: should we change to an empty item object for type consistency?
        return <div>
            <b>As author '{this.state.ProgramPerson.get("name")}'</b> <ul>{items}</ul>
        </div>
        if(this.state.ProgramPerson.get("userProfile")){
            return <UserStatusDisplay profileID={this.state.ProgramPerson.get("userProfile").id} style={{display: 'inline'}} />
        }
        return <Tooltip title={this.state.ProgramPerson.get("name") + " has not yet linked their CLOWDR and author records. To link these records, please go to 'My Account'."}><span className="programPerson">{this.state.ProgramPerson.get("name")}</span></Tooltip>
    }
}