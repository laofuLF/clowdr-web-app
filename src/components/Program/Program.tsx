import React from 'react';
import {Descriptions, Radio, Skeleton, Spin, Table, Tag, Tooltip} from 'antd';
import Parse from "parse";
import {AuthUserContext} from "../Session";
import {NavLink} from "react-router-dom";
import {StarFilled, StarOutlined} from "@ant-design/icons";
import ProgramItemDisplay from "./ProgramItemDisplay";
import {ClowdrState} from "../../ClowdrTypes";
import {assert} from "../../Util";

var moment = require('moment');
var timezone = require('moment-timezone');

function groupBy(list: any[], keyGetter: any) {
    const map: Map<any, any> = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

interface ProgramProps {
    auth: ClowdrState | null;
    id: string;
}

interface ProgramState {
    ProgramSessions: Parse.Object[],
    loading: boolean,
    starredProgram: Parse.Object | undefined,
    selectedDays: any[],
    starredItems: Parse.Object[] | undefined,
    filterByStar: boolean, // TS: a boolean?
    timeZone: String | any, // TS: time zone type is any?
    sessionDays: any[]
}

class Program extends React.Component<ProgramProps, ProgramState> {
    constructor(props: ProgramProps) {
        super(props);
        console.log("program props are: " + this.props);
        this.state = {
            ProgramSessions: [],
            loading: true,
            starredProgram: undefined,
            selectedDays: [],
            starredItems: [],
            filterByStar: false, // TS: initially false?
            timeZone: timezone.tz.guess(),
            sessionDays: [],
        }
    }
    async componentDidMount() {
        //find our saved program
        if (this.props.auth) {
            if(this.props.auth.userProfile) {
                let StarredProgram = Parse.Object.extend("StarredProgram");
                let progQ = new Parse.Query(StarredProgram);
                progQ.equalTo("user", this.props.auth.userProfile)
                progQ.first().then(async res=>{
                    if(!res){
                        res = new StarredProgram();
                        if (res) {
                            res.set("user", this.props.auth?.userProfile);
                            res.save();
                        }
                    }

                    let itemsQ = res?.relation("items").query();
                    itemsQ?.limit(1000);
                    let starredItems = await itemsQ?.find();
                    this.setState({starredProgram: res, starredItems: starredItems});
                });
            }
        }

        let sessions = await this.props.auth?.programCache.getProgramSessions(this);
        this.setState({ProgramSessions: sessions, loading: false});
        this.programLoaded(sessions);
    }

    formatSessionsIntoTable(sessions: Parse.Object[]){
        let groupedByDate = groupBy(sessions,
            (item: Parse.Object)=>timezone(item.get("startTime")).tz(this.state.timeZone).format("ddd MMM D"));
        let table = [];
        // @ts-ignore TS traverse through a map in TS
        for(const [date, rawSessions] of groupedByDate){
            if(this.state.selectedDays.length > 0 && !this.state.selectedDays.includes(date))
                continue;
            let dateHeader = {label: date, rowSpan: 0};
            let row = {
                date: dateHeader,
                timeBand: {label: "", rowSpan: 0},
                session: {label: "", rowSpan: 0},
                key: "",
                programItem: "",
                confKey: "",
                item: Parse.Object
            };
            // let timeBands = groupBy(rawSessions,(session: any)=>
            //     (<Tooltip mouseEnterDelay={0.5} title={timezone(session.get("startTime")).tz(this.state.timeZone).format("ddd MMM D LT ") +" - "+ timezone(session.get("endTime")).tz(this.state.timeZone).format("LT z")}>
            //         {timezone(session.get("startTime")).tz(this.state.timeZone).format("LT")} - {timezone(session.get("endTime")).tz(this.state.timeZone).format("LT")}</Tooltip>))

            // @ts-ignore find a way to traverse through a map in TS?
            for(const [time, sessions ] of timeBands){
                let timeBandHeader = {label: time, rowSpan: 0};
                row.timeBand = timeBandHeader;
                for (let session of sessions) {
                    let sessionHeader = {label: session.get("title"), rowSpan: 0};
                    row.session = sessionHeader;
                    if (session.get("items")) {
                        for (let programItem of session.get("items")) {
                            if(this.state.filterByStar && !this.state.starredItems?.find(item=>item.id == programItem.id))
                                continue;
                            row.key = session.id+"-"+programItem.id;
                            row.programItem = programItem.id;
                            row.confKey = programItem.get("confKey");
                            row.item = programItem;
                            table.push(row);
                            row = {
                                date: {label: "", rowSpan: 0},
                                timeBand: {label: "", rowSpan: 0},
                                session: {label: "", rowSpan: 0},
                                key: "",
                                programItem: "",
                                confKey: "",
                                item: Parse.Object
                            };
                            // row.session = {};
                            // row.timeBand = {};
                            // row.date = {};
                            dateHeader.rowSpan++;
                            timeBandHeader.rowSpan++;
                            sessionHeader.rowSpan++;
                        }
                    }
                }
            }
        }
        return table;
    }

    render() {
        if(this.state.loading){
            return <Spin></Spin>
        }
        let days = [];
        // for(const [date, program] of this.state.sessions){
        //     days.push(<ProgramDay date={date} program={program} key={date} formatTime={this.state.formatTime} />)
        // }


        let cols = [{
            title: 'Saved',
            className: "program-table-starred",
            render: (value: any, row: any, index: number) => { // TS: row a Parse Object?
                let starred = this.state.starredItems?.find(item => item.id == row.item.id);
                return (starred ? <Tooltip title="Remove this from your saved program" placement="top"><StarFilled className="programStarStarred" onClick={()=> {
                        this.state.starredProgram?.relation("items").remove(row.item);
                        this.state.starredProgram?.save().catch((err) => console.log(err));
                        this.setState((prevState) => ({
                            starredItems: prevState.starredItems?.filter(item => item.id !== row.item.id)
                        }));
                }} /></Tooltip> :  <Tooltip title="Add this iem to your saved program" placement="top"><StarOutlined className="programStarNotStarred" onClick={()=> {
                        this.state.starredProgram?.relation("items").add(row.item);
                        this.state.starredProgram?.save().catch((err) => console.log(err));
                        this.setState((prevState: Readonly<ProgramState>) => {
                            assert(prevState.starredItems);
                            return {starredItems: [row.item, ...prevState.starredItems]};
                        });

                }} /></Tooltip>);
            }
        },{
            title: 'Date',
            className:"program-table-date",
            dataIndex: 'date',
            render: (value: any, row: any, index: number) => {
                const obj = {
                    children: value.label,
                    props: {
                        rowSpan: 0
                    }
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            },
        },{  title: 'Time',
            dataIndex: 'timeBand',
            className:"program-table-timeBand",
            render: (value: any, row: any, index: number) => {
                const obj = {
                    children: value.label,
                    props: {
                        rowSpan: 0
                    }
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            }
        },{  title: 'Session',
            className:"program-table-session",
            dataIndex: 'session',
            render: (value: any, row: any, index: number) => {
                const obj = {
                    children: value.label,
                    props: {
                        rowSpan: 0
                    }
                }
                if (value && value.rowSpan)
                    obj.props.rowSpan = value.rowSpan;
                else
                    obj.props.rowSpan = 0;
                return obj;
            }
        },
            {
                title: "Content",
                className:"program-table-programItem",
                dataIndex: "programItem",
                render: (value: any, row: any, index: number)=>{
                    return <ProgramItemDisplay auth={this.props.auth} id={value} showBreakoutRoom={true}/> // TS: initially show breakout room?
                }
            }
        ];
        const props = {width: 700, zoomWidth: 700,  zoomPosition: "original", img: 'https://2020.icse-conferences.org/getImage/orig/ICSE-Schedule.PNG'};
        return <div>
            <h4>Program Overview:</h4>
            {/* <ReactImageZoom {...props}/> */}

            <h4>Details:</h4>
            <Descriptions title="Filter">
                <Descriptions.Item label="Filter by day"><span className="filterOptions">{this.state.sessionDays? this.state.sessionDays.map(day=><Tag.CheckableTag
                    // color="red"
                    checked={this.state.selectedDays.indexOf(day) > -1}
                    onChange={checked => {
                        this.setState(prevState => ({ selectedDays: checked ? [...prevState.selectedDays, day] : prevState.selectedDays.filter(t => t !== day)}));
                    }}
                    key={day}>{day}</Tag.CheckableTag>) : <Skeleton.Input />}</span></Descriptions.Item>
                <Descriptions.Item label="Filter by Starred">
                    <Radio.Group defaultValue={false} onChange={e => {this.setState({filterByStar: e.target.value})}}>
                        <Radio.Button value={false}>All</Radio.Button>
                        <Radio.Button value={true}><StarFilled className="programStarStarred" /> Only</Radio.Button>
                    </Radio.Group>
                </Descriptions.Item>
            </Descriptions>
            <Radio.Group defaultValue="timezone.tz.guess()" onChange={e => {this.setState({timeZone: e.target.value})}}>
                <Radio.Button value="timezone.tz.guess()">Local Time</Radio.Button>
                <Radio.Button value="UTC">UTC Time</Radio.Button>
            </Radio.Group>

            <br />
            <br />

            <div className="programPage">
                <div className="programFilters">
                   {/*<Form>*/}
                   {/*    <Form.Item label={"Track"}>*/}
                   {/*        <Select mode="multiple" placeholder="Filter by track" options={this.state.tracks}/>*/}
                   {/*    </Form.Item>*/}
                   {/*</Form>*/}
                </div>
                <Table columns={cols} pagination={false} dataSource={
                    this.formatSessionsIntoTable(this.state.ProgramSessions.sort((a,b)=> {
                        return a.get("startTime") && b.get("startTime") ? moment(a.get("startTime")).diff(moment(b.get('startTime'))) : 0
                    }
                ))} loading={this.state.loading}></Table>
            </div>
        </div>
    }

    programLoaded(sessions: Parse.Object[]) {
        // if(this.state.loading){
            assert(sessions);
            // @ts-ignore
        let days = [...new Set(sessions.map((item: Parse.Object)=>timezone(item.get("startTime")).tz(this.state.timeZone).format("ddd MMM D")))];
            this.setState({sessionDays: days})
        // }
    }
}

interface ProgramDayProps {
    session: Parse.Object;
    formatTime: any,
    date: string // TS: is date a string ?
}

interface ProgramDayState {
    program: Parse.Object[],
    timeBands: any
}

class ProgramDay extends React.Component<ProgramDayProps, ProgramDayState> {
    constructor(props: ProgramDayProps) {
        super(props);
        //organize into time bands
        let timeBands = groupBy(this.state.program,(session: Parse.Object)=>(this.props.formatTime(session.get("startTime"))+ " - ") + this.props.formatTime(session.get('endTime')))
        this.state = {
            program: [],
            timeBands: timeBands
        }
    }
    render(){
        let timeBands = [];
        for(const[timeBand, sessions] of this.state.timeBands){
            timeBands.push(<div key={timeBand} className="sessionTimeBandContainer"><div className="timeBand">{timeBand}</div>
            <div className="sessionContainer">{sessions.map((s: Parse.Object) =><ProgramSession key={s.id} session={s}/>)}</div></div>)
        }
        return <div className="program-programDay" key={this.props.date}>
            <div className="day">{this.props.date}</div>
            <div className="timebands">{timeBands}</div>
        </div>
    }
}

interface ProgramSessionProps {
    session: Parse.Object;
}

interface ProgramSessionState {
}

class ProgramSession extends React.Component<ProgramSessionProps, ProgramSessionState> {
    render() {
        let items = this.props.session.get("items");
        return <div className="programSession" >
            <div className="sessionTitle">{this.props.session.get("title")}</div>
            <div className="sessionContents">
                {items.map((i: Parse.Object) => <ProgramItem key={i.id} item={i}/>)}
            </div>
        </div>
    }
}

interface ProgramItemProps {
    item: Parse.Object
}

interface ProgramItemState {
}

class ProgramItem extends React.Component<ProgramItemProps, ProgramItemState> {
    constructor(props: ProgramItemProps) {
        super(props);
    }
    render() {
        return (
            <div className="programItem" key={this.props.item.id}>
                {this.props.item.get("title")}
            </div>
        );
    }
}

const AuthConsumer = (props: ProgramProps) => (
        <AuthUserContext.Consumer>
            {value => (
                <Program {...props} auth={value}  />
            )}
        </AuthUserContext.Consumer>
    );
export default AuthConsumer;