import React from "react";
import {Button, Form, Input, message, Modal, Radio, Tooltip} from "antd";
import {AuthUserContext} from "../Session";
import {withRouter} from "react-router-dom";

class NewRoomForm extends React.Component {


    constructor(props) {
        super(props);
        this.form = React.createRef();
        this.state = {
            ModalText: 'Content of the modal',
            visible: this.props.visible,
            confirmLoading: false,
        };
    }
    showModal = () => {
        this.setState({
            visible: true,
        });
    };

    handleCancel = () => {
        if (this.form && this.form.current)
            this.form.current.resetFields();
        this.setState({
            visible: false,
        });

    };

    render() {
        const { visible, confirmLoading, ModalText } = this.state;
        let buttonText = (this.props.text ? this.props.text : "New Room");
        let buttonType= (this.props.type ? this.props.type : "primary");

        return this.props.auth.helpers.ifPermission("createVideoRoom",
            <div>
                <Button type={buttonType} onClick={this.showModal} style={this.props.style}>
                    {buttonText}
                </Button>
                <Modal
                    zIndex="200"
                    title="Create a new video chat room"
                    visible={visible}
                    confirmLoading={confirmLoading}
                    footer={[
                        <Button form="myForm" key="submit" type="primary" htmlType="submit" loading={confirmLoading}>
                            Create and Join
                        </Button>
                    ]}
                    onCancel={this.handleCancel}
                >
                    <Form
                        layout="vertical"
                        name="form_in_modal"
                        ref={this.form}

                        id="myForm"
                        initialValues={{
                            title: this.props.initialName,
                            visibility: 'listed',
                            // category: 'general',
                            // mode: 'group-small',
                            mode: 'peer-to-peer',
                            persistence: 'ephemeral'
                        }}
                        onFinish={async (values) => {
                            this.setState({confirmLoading: true});
                            let user = this.props.auth.user;
                            let idToken = user.getSessionToken();
                            const data = await fetch(
                                `${process.env.REACT_APP_TWILIO_CALLBACK_URL}/video/new`
                                , {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        room: values.title,
                                        visibility: values.visibility,
                                        category: values.category,
                                        persistence: values.persistence,
                                        mode: values.mode,
                                        identity: idToken,
                                        slackTeam: this.props.auth.currentConference.get("slackWorkspace"),
                                    }),
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                            let res = await data.json();
                            if (res.status == "error") {
                                message.error(res.message);
                                this.setState({confirmLoading: false})
                            } else {
                                this.form.current.resetFields();
                                this.setState({confirmLoading: false, visible: false})
                                this.props.history.push("/video/" + encodeURI(this.props.auth.currentConference.get("conferenceName")) + "/" + encodeURI(values.title));
                            }
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input the title for your video room.',
                                },
                            ]}
                        >
                            <Input/>
                        </Form.Item>
                        {/*<Form.Item*/}
                        {/*    name="category"*/}
                        {/*    label="Category"*/}
                        {/*>*/}
                        {/*    <Select>*/}
                        {/*        <Select.Option value="general">General</Select.Option>*/}
                        {/*        <Select.Option value="bof">Birds-of-a-Feather</Select.Option>*/}
                        {/*    </Select>*/}
                        {/*</Form.Item>*/}
                        <Form.Item
                            name="persistence"
                            label="Persistence"
                            extra={"Ephemeral rooms disappear 5 minutes after the last participant leaves"}>
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value="ephemeral">Ephemeral</Radio.Button>
                                {this.props.auth.helpers.ifPermission("createVideoRoom-persistent",
                                    <Radio.Button value="persistent">Persistent</Radio.Button>,
                                    <Tooltip title="You do not have access permissions to create persistent rooms"><Radio.Button disabled={true} value="persistent">Persistent</Radio.Button></Tooltip>
                                )}
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            name="mode"
                            label="Room connection mode and participant capacity"
                            extra={"Peer-to-Peer rooms may have not work as well across continents or on mobile devices."}>
                            <Radio.Group buttonStyle="solid">
                                {this.props.auth.helpers.ifPermission("createVideoRoom-peer-to-peer",
                                    <Radio.Button value="peer-to-peer">Peer-to-Peer (1-10)</Radio.Button>,
                                    <Tooltip title="You do not have access permissions to create peer-to-peer rooms"><Radio.Button value="peer-to-peer" disabled={true}>Peer-to-Peer (1-10)</Radio.Button></Tooltip>)}
                                {this.props.auth.helpers.ifPermission("createVideoRoom-smallgroup",<Radio.Button value="group-small">Small Group (1-4)</Radio.Button>,
                                    <Tooltip title="You do not have access permissions to create small group rooms"><Radio.Button value="group-small" disabled={true}>Small Group (1-4)</Radio.Button></Tooltip>)}
                                {this.props.auth.helpers.ifPermission("createVideoRoom-group",<Radio.Button value="group">Large Group (4-24)</Radio.Button>,
                                    <Tooltip title="You do not have access permissions to create peer-to-peer rooms"><Radio.Button value="group">Large Group (1-24)</Radio.Button></Tooltip>)}

                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            name="visibility"
                            label="Visibility"
                            extra={"'Open' video calls can be joined by any member of the " + this.props.auth.currentConference.get("conferenceName") +" slack workspace. " +
                            "Private rooms allow you to restrict access to specific users of the workspace"
                            }
                        >
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value="listed">Open</Radio.Button>
                                {this.props.auth.helpers.ifPermission("createVideoRoom-private",
                                    <Radio.Button value="unlisted">Private</Radio.Button>,
                                    <Tooltip title="You do not have access permissions to create private rooms"><Radio.Button disabled={true} value="unlisted">Private</Radio.Button></Tooltip>
                                )}

                            </Radio.Group>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        );
    }
}
const AuthConsumer = (props) => (
            <AuthUserContext.Consumer>
                {value => (
                    <NewRoomForm {...props} auth={value} />
                )}
            </AuthUserContext.Consumer>

);
export default withRouter(AuthConsumer);