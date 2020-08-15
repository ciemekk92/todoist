import React, { useState, useContext } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import firebase from 'firebase/app';
import { firestore } from '../../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { hiddenListContext } from '../../context/hiddenListContext';
import { updateObject } from '../../shared/utility';
import * as actions from '../../store/actions';
import useDidMountEffect from '../../hooks/useDidMountEffect';
import { Bar, ButtonsContainer, PanelText, LabelPanel } from './Sidebar.styled';
import SidebarModal from '../../components/Sidebar/SidebarModal/SidebarModal';
import NewListInput from '../../components/Sidebar/NewList/NewListInput/NewListInput';
import PanelContainer from '../../components/Sidebar/PanelContainer/PanelContainer';
import ListPanel from '../../components/Sidebar/ListPanel/ListPanel';
import AddNewList from '../../components/Sidebar/NewList/AddNewList';
import { Item, List, Tag } from '../../types';
import EditButton from '../../components/ListDetails/EditButton/EditButton';
import { Home, Unread, Github, Mail, Tags } from '../../components/Icons';
import { CSSTransition } from 'react-transition-group';
import './Sidebar.css';
import TagPanel from '../../components/Sidebar/TagPanel/TagPanel';
import ColorPicker from '../../components/Sidebar/NewList/ColorPicker/ColorPicker';

const Sidebar: React.FC<Props> = (props) => {
    const {
        lists,
        tags,
        selectedItem,
        currentColor,
        currentList,
        currentTag,
        onSettingCurrentList,
        onSettingCurrentTag,
        onGettingUserInfo,
        onSettingSelectedItemEmpty,
        open,
        setOpen
    } = props;

    // TODO: Finish implementing selecting current tag & tag view

    const { handleClick } = useContext(hiddenListContext);

    const [newList, setNewList] = useState({
        name: '',
        id: '',
        timestamp: 0,
        listItems: {
            completed: [],
            notCompleted: []
        }
    });
    const [newTag, setNewTag] = useState({
        id: '',
        name: '',
        color: ''
    });
    const [adding, setAdding] = useState(false);
    const [addingWhat, setAddingWhat] = useState('');
    const [deletingList, setDeletingList] = useState(false);
    const [listToDelete, setListToDelete] = useState('');
    const [warning, setWarning] = useState('');
    const [isShown, setIsShown] = useState(false);
    const [areTagsShown, setAreTagsShown] = useState(false);

    const listInputChangedHandler = (
        event: React.ChangeEvent,
        list: typeof newList
    ) => {
        const target = event.target as HTMLInputElement;
        const updatedData = updateObject(list, {
            name: target.value
        });
        setNewList(updatedData);
    };

    const tagInputChangedHandler = (
        event: React.ChangeEvent,
        tag: typeof newTag
    ) => {
        const target = event.target as HTMLInputElement;
        const updatedData = updateObject(tag, {
            name: target.value
        });
        setNewTag(updatedData);
    };

    const toggleAdding = (type?: string) => {
        if (type) {
            setAddingWhat(type);
        }
        setAdding(!adding);
        setWarning('');
    };

    const toggleDeleting = () => {
        setDeletingList(!deletingList);
    };

    const currentListHandler = (list: string) => {
        if (list !== currentList) {
            handleClick(true);
            onSettingCurrentList(list);
            setOpen();
            if (selectedItem.id) {
                onSettingSelectedItemEmpty();
            }
            setTimeout(() => {
                handleClick(false);
            }, 500);
        }
    };

    const newListHandler = async (list: List) => {
        if (newList.name !== '') {
            setAdding(false);
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const listWithTimestamp = updateObject(list, {
                id: uuidv4(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            let key = `lists.${list.name}`;

            try {
                await docRef
                    .update({
                        [key]: listWithTimestamp
                    })
                    .then((response) => onGettingUserInfo())
                    .catch((error) =>
                        alert(
                            'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                                error
                        )
                    );
            } catch (error) {
                alert(
                    'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                        error
                );
            }
        } else {
            setWarning('Name of the list must not be empty!');
        }
    };

    const deleteList = async (list: string) => {
        const uid: any = localStorage.getItem('currentUser');
        const docRef = await firestore.collection('users').doc(uid);

        let key = `lists.${list}`;

        try {
            await docRef
                .update({
                    [key]: firebase.firestore.FieldValue.delete()
                })
                .catch((error) =>
                    alert(
                        'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                            error
                    )
                );
        } catch (error) {
            alert(
                'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                    error
            );
        }
    };

    const deleteListHandler = (list: string) => {
        if (
            lists[list].listItems.completed.length !== 0 ||
            lists[list].listItems.notCompleted.length !== 0
        ) {
            setListToDelete(list);
            toggleDeleting();
        } else {
            try {
                deleteList(list).then((response) => {
                    onGettingUserInfo();
                });
            } catch (error) {
                alert(
                    'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                        error
                );
            }
        }
    };

    const handleConfirm = () => {
        try {
            deleteList(listToDelete).then((response) => {
                toggleDeleting();
                onGettingUserInfo();
            });
        } catch (error) {
            alert(
                'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                    error
            );
        }
    };

    const newTagHandler = async (tag: { name: string; color: string }) => {
        if (newTag.name !== '') {
            setAdding(false);
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const updatedTag = updateObject(tag, {
                id: uuidv4(),
                color: currentColor
            });

            try {
                await docRef
                    .update({
                        tags: firebase.firestore.FieldValue.arrayUnion(
                            updatedTag
                        )
                    })
                    .then((response) => onGettingUserInfo())
                    .catch((error) =>
                        alert(
                            'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                                error
                        )
                    );
            } catch (error) {
                alert(
                    'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                        error
                );
            }
        } else {
            setWarning('Name of the tag must not be empty!');
        }
    };

    const currentTagHandler = (id: string) => {
        if (id !== currentTag.id) {
        }
    };

    const handleListVisibility = () => {
        setIsShown(!isShown);
    };

    const handleTagsVisibility = () => {
        setAreTagsShown(!areTagsShown);
    };

    let listsArray = Object.keys(lists).sort();

    useDidMountEffect(() => {
        onSettingCurrentList(listsArray[0]);
    }, [listsArray.length]);

    // TODO Rework layout
    return (
        <Bar open={open}>
            <SidebarModal
                open={adding}
                modalClosed={toggleAdding}
                warning={warning}
            >
                {addingWhat === 'list' ? (
                    <>
                        Enter new list name below.
                        <NewListInput
                            changed={(event) =>
                                listInputChangedHandler(event, newList)
                            }
                            value={newList.name}
                            submit={() => newListHandler(newList)}
                            type={'list'}
                        />
                        <ButtonsContainer>
                            <EditButton
                                type={'confirm'}
                                title={'Confirm adding new list'}
                                clicked={() => newListHandler(newList)}
                                size={16}
                            />
                            <EditButton
                                type={'cancel'}
                                title={'Cancel'}
                                clicked={() => setAdding(!adding)}
                                size={16}
                            />
                        </ButtonsContainer>
                    </>
                ) : (
                    <>
                        Enter new tag name below.
                        <NewListInput
                            changed={(event) =>
                                tagInputChangedHandler(event, newTag)
                            }
                            value={newTag.name}
                            submit={() => newTagHandler(newTag)}
                            type={'tag'}
                        />
                        <ColorPicker />
                        <ButtonsContainer>
                            <EditButton
                                type={'confirm'}
                                title={'Confirm adding new list'}
                                clicked={() => newTagHandler(newTag)}
                                size={16}
                            />
                            <EditButton
                                type={'cancel'}
                                title={'Cancel'}
                                clicked={() => setAdding(!adding)}
                                size={16}
                            />
                        </ButtonsContainer>
                    </>
                )}
            </SidebarModal>
            <SidebarModal open={deletingList} modalClosed={toggleDeleting}>
                This will delete ALL tasks saved in the list. <br /> Are you
                sure?
                <ButtonsContainer>
                    <EditButton
                        type={'confirm'}
                        title={'Confirm deleting'}
                        clicked={handleConfirm}
                        size={16}
                    />
                    <EditButton
                        type={'cancel'}
                        title={'Cancel'}
                        clicked={() => setDeletingList(false)}
                        size={16}
                    />
                </ButtonsContainer>
            </SidebarModal>
            {/*TODO: Set correct routing here */}
            <LabelPanel>
                <Home
                    size={24}
                    color={'#666'}
                    title={'Home'}
                    style={{ marginLeft: '2rem' }}
                />
                <p>Home</p>
            </LabelPanel>
            <LabelPanel onClick={handleListVisibility}>
                <Unread
                    size={24}
                    title={'My lists'}
                    color={'#666'}
                    style={{ marginLeft: '2rem' }}
                />
                <p>My lists</p>
            </LabelPanel>
            <CSSTransition
                in={isShown}
                timeout={300}
                classNames={'lists'}
                mountOnEnter
                unmountOnExit
            >
                <PanelContainer>
                    {
                        // sort alphabetically
                        listsArray.length !== 0 ? (
                            listsArray
                                .slice()
                                .sort()
                                .map((element) => (
                                    <ListPanel
                                        active={currentList === element}
                                        name={element}
                                        key={uuidv4()}
                                        clicked={() =>
                                            currentListHandler(element)
                                        }
                                        clickedDelete={() =>
                                            deleteListHandler(element)
                                        }
                                        mobileClicked={() => setOpen()}
                                        count={
                                            lists[element].listItems.completed
                                                .length +
                                            lists[element].listItems
                                                .notCompleted.length
                                        }
                                    />
                                ))
                        ) : (
                            <PanelText>
                                Create a new list by clicking a button down
                                below!
                            </PanelText>
                        )
                    }
                    <AddNewList
                        clicked={
                            !adding
                                ? () => toggleAdding('list')
                                : () => newListHandler(newList)
                        }
                        type={'list'}
                    />
                </PanelContainer>
            </CSSTransition>
            <LabelPanel onClick={handleTagsVisibility}>
                <Tags
                    size={24}
                    title={'Tags'}
                    color={'#666'}
                    style={{ marginLeft: '2rem' }}
                />
                <p>Tags</p>
            </LabelPanel>
            <CSSTransition
                in={areTagsShown}
                timeout={300}
                classNames={'lists'}
                mountOnEnter
                unmountOnExit
            >
                <PanelContainer>
                    {tags.map((element) => (
                        <TagPanel
                            color={element.color}
                            key={element.id}
                            active={false}
                            clicked={() => currentTagHandler(element.id)}
                        >
                            {element.name}
                        </TagPanel>
                    ))}
                    <AddNewList
                        type={'tag'}
                        clicked={
                            !adding ? toggleAdding : () => newTagHandler(newTag)
                        }
                    />
                </PanelContainer>
            </CSSTransition>
            <LabelPanel>
                <Github
                    size={24}
                    title={'Github'}
                    color={'#666'}
                    style={{ marginLeft: '2rem' }}
                />
                <a
                    href="https://github.com/ciemekk92/listify"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <p>GitHub Repository</p>
                </a>
            </LabelPanel>
            <LabelPanel>
                <Mail
                    size={24}
                    title={'Contact'}
                    color={'#666'}
                    style={{ marginLeft: '2rem' }}
                />
                <a href="https://www.facebook.com/przemyslaw.reducha/">
                    <p>Contact Author</p>
                </a>
            </LabelPanel>
        </Bar>
    );
};

const mapStateToProps = (state: {
    user: {
        userInfo: {
            lists: any;
            tags: Tag[];
        };
    };
    list: {
        currentList: string;
        selectedItem: Item;
        currentColor: string;
        currentTag: Tag;
    };
}) => {
    return {
        lists: state.user.userInfo.lists,
        tags: state.user.userInfo.tags,
        selectedItem: state.list.selectedItem,
        currentList: state.list.currentList,
        currentColor: state.list.currentColor,
        currentTag: state.list.currentTag
    };
};

const mapDispatchToProps = {
    onGettingUserInfo: () => actions.initUserInfo(),
    onSettingCurrentList: (list: string) => actions.setCurrentList(list),
    onSettingCurrentTag: (tag: { name: string; id: string; color: string }) =>
        actions.setCurrentTag(tag),
    onSettingSelectedItemEmpty: () => actions.setSelectedItemEmpty()
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & {
    open: boolean;
    setOpen(): void;
};

export default connector(React.memo(Sidebar));
