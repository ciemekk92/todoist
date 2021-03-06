import React, { useState, useContext, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import firebase from 'firebase/app';
import { firestore } from '../../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { hiddenListContext } from '../../context/hiddenListContext';
import { alertError, updateObject } from '../../shared/utility';
import * as actions from '../../store/actions';
import useDidMountEffect from '../../hooks/useDidMountEffect';
import {
    Bar,
    ButtonsContainer,
    PanelText,
    LabelPanel,
    ModalInput
} from './Sidebar.styled';
import SidebarModal from '../../components/Sidebar/SidebarModal/SidebarModal';
import PanelContainer from '../../components/Sidebar/PanelContainer/PanelContainer';
import ListPanel from '../../components/Sidebar/ListPanel/ListPanel';
import AddNewList from '../../components/Sidebar/NewList/AddNewList';
import { Item, List, Tag } from '../../types';
import EditButton from '../../components/ListDetails/EditButton/EditButton';
import { Unread, Github, Mail, Tags } from '../../components/Icons';
import { CSSTransition } from 'react-transition-group';
import '../../components/ListDetails/Transitions.css';
import TagPanel from '../../components/Sidebar/TagPanel/TagPanel';
import ColorPicker from '../../components/Sidebar/NewList/ColorPicker/ColorPicker';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { clearItemsTag } from '../../firebase/ListFunctions';

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

    const { handleClick } = useContext(hiddenListContext);

    const initialList = {
        name: '',
        id: '',
        timestamp: 0,
        listItems: {
            completed: [],
            notCompleted: []
        }
    };

    const initialTag = {
        id: '',
        name: '',
        color: '',
        items: []
    };

    const [newList, setNewList] = useState(initialList);
    const [newTag, setNewTag] = useState(initialTag);
    const [adding, setAdding] = useState(false);
    const [addingWhat, setAddingWhat] = useState('');
    const [deletingList, setDeletingList] = useState(false);
    const [listToDelete, setListToDelete] = useState('');
    const [warning, setWarning] = useState('');
    const [areListsShown, setAreListsShown] = useState(true);
    const [areTagsShown, setAreTagsShown] = useState(false);

    let listsArray = Object.keys(lists).sort();
    let tagsArray = Object.values(tags);
    let tagNamesArray = Object.keys(tags);

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
            }, 400);
        }
    };

    const clearInput = (isList: boolean) => {
        if (isList) {
            setNewList(initialList);
        } else {
            setNewTag(initialTag);
        }
    };

    const newListHandler = async (list: List) => {
        if (listsArray.includes(list.name)) {
            setWarning(
                'List with this name already exists, choose another one!'
            );
        } else if (newList.name === '') {
            setWarning('Name of the list must not be empty!');
        } else {
            if (newList.name !== null) {
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
                        .then(() => {
                            clearInput(true);
                            onGettingUserInfo();
                        })
                        .catch((error) => alertError(error));
                } catch (error) {
                    alertError(error);
                }
            }
        }
    };

    const deleteList = async (list: string) => {
        const uid: any = localStorage.getItem('currentUser');
        const docRef = await firestore.collection('users').doc(uid);

        let key = `lists.${list}`;

        try {
            for (const element of lists[list].listItems.completed.concat(
                lists[list].listItems.notCompleted
            )) {
                let tagKey = `tags.${element.tag.name}.items`;
                await docRef
                    .update({
                        [tagKey]: firebase.firestore.FieldValue.arrayRemove(
                            element
                        )
                    })
                    .catch((error) => alertError(error));
            }
        } catch (error) {
            alertError(error);
        }

        try {
            await docRef
                .update({
                    [key]: firebase.firestore.FieldValue.delete()
                })
                .catch((error) => alertError(error));
        } catch (error) {
            alertError(error);
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
                deleteList(list).then(() => {
                    onGettingUserInfo();
                });
            } catch (error) {
                alertError(error);
            }
        }
    };

    const handleConfirm = () => {
        try {
            deleteList(listToDelete).then(() => {
                toggleDeleting();
                onGettingUserInfo();
            });
        } catch (error) {
            alertError(error);
        }
    };

    const newTagHandler = async (tag: {
        name: string;
        color: string;
        items: never[];
    }) => {
        if (tagNamesArray.includes(newTag.name)) {
            setWarning(
                'Tag with this name already exists, choose another one!'
            );
        } else if (newTag.name === '') {
            setWarning('Name of the tag must not be empty!');
        } else {
            setAdding(false);
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const updatedTag = updateObject(tag, {
                id: uuidv4(),
                color: currentColor
            });

            let key = `tags.${updatedTag.name}`;

            try {
                await docRef
                    .update({
                        [key]: updatedTag
                    })
                    .then(() => {
                        clearInput(false);
                        onGettingUserInfo();
                    })
                    .catch((error) => alertError(error));
            } catch (error) {
                alertError(error);
            }
        }
    };

    const tagDeleteHandler = async (tag: Tag) => {
        const uid: any = localStorage.getItem('currentUser');
        const docRef = await firestore.collection('users').doc(uid);

        let key = `tags.${tag.name}`;

        if (currentTag.name === tag.name) {
            onSettingCurrentTag({ name: '', id: '', color: '', items: [] });
        }

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
        try {
            for (const element of tags[tag.name].items) {
                await clearItemsTag(
                    element.list,
                    element.id,
                    element.completed,
                    {
                        lists: lists
                    }
                );
            }
        } catch (error) {
            alert(
                'Something went wrong. Refresh the page and try again. If a problem persists message the author at https://www.facebook.com/przemyslaw.reducha/ ' +
                    error
            );
        } finally {
            onGettingUserInfo();
        }
    };

    const currentTagHandler = (tag: Tag) => {
        if (tag.id !== currentTag.id) {
            handleClick(true);
            onSettingCurrentTag(tag);

            if (selectedItem.id) {
                onSettingSelectedItemEmpty();
            }
            setTimeout(() => {
                handleClick(false);
            }, 400);
        }
    };

    const handleListVisibility = () => {
        setAreListsShown(!areListsShown);
    };

    const handleTagsVisibility = () => {
        setAreTagsShown(!areTagsShown);
    };

    const wrapperRefAdding: React.Ref<HTMLDivElement> = useRef(null);
    const wrapperRefDeleting: React.Ref<HTMLDivElement> = useRef(null);

    useOutsideClick(wrapperRefAdding, () => {
        setAdding(false);
    });

    useOutsideClick(wrapperRefDeleting, () => {
        setDeletingList(false);
    });

    useDidMountEffect(() => {
        onSettingCurrentList(listsArray[0]);
    }, [listsArray.length]);

    return (
        <Bar open={open}>
            <SidebarModal
                open={adding}
                warning={warning}
                ref={wrapperRefAdding}
            >
                {addingWhat === 'list' ? (
                    <>
                        Enter new list name below.
                        <ModalInput
                            onChange={(event) =>
                                listInputChangedHandler(event, newList)
                            }
                            value={newList.name}
                            placeholder={'New list name'}
                            onSubmit={() => newListHandler(newList)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    newListHandler(newList);
                                }
                            }}
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
                        <ModalInput
                            onChange={(event) =>
                                tagInputChangedHandler(event, newTag)
                            }
                            value={newTag.name}
                            placeholder={'New tag name'}
                            onSubmit={() => newTagHandler(newTag)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    newTagHandler(newTag);
                                }
                            }}
                        />
                        <ColorPicker />
                        <ButtonsContainer>
                            <EditButton
                                type={'confirm'}
                                title={'Confirm adding new tag'}
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
            <SidebarModal open={deletingList} ref={wrapperRefDeleting}>
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
            <LabelPanel onClick={handleListVisibility}>
                <Unread
                    size={24}
                    title={'My lists'}
                    color={'#3f72af'}
                    style={{ marginLeft: '2rem' }}
                />
                <p>My lists</p>
            </LabelPanel>
            <CSSTransition
                in={areListsShown}
                timeout={300}
                classNames={'height'}
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
                    color={'#3f72af'}
                    style={{ marginLeft: '2rem' }}
                />
                <p>Tags</p>
            </LabelPanel>
            <CSSTransition
                in={areTagsShown}
                timeout={300}
                classNames={'height'}
                mountOnEnter
                unmountOnExit
            >
                <PanelContainer>
                    {tagsArray
                        .slice()
                        .sort((a: Tag, b: Tag) => {
                            // sort alphabetically, ignoring upper and lower case
                            const nameA = a.name.toUpperCase();
                            const nameB = b.name.toUpperCase();
                            if (nameA < nameB) {
                                return -1;
                            }
                            if (nameA > nameB) {
                                return 1;
                            }
                            return 0;
                        })
                        .map((element) => (
                            <TagPanel
                                count={element.items.length}
                                color={element.color}
                                key={element.id}
                                active={currentTag.id === element.id}
                                clicked={() => currentTagHandler(element)}
                                clickedDelete={() => tagDeleteHandler(element)}
                                name={element.name}
                                mobileClicked={() => setOpen()}
                            />
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
                    color={'#3f72af'}
                    style={{ marginLeft: '2rem' }}
                />
                <a
                    href="https://github.com/ciemekk92/listify"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <p>GitHub</p>
                </a>
            </LabelPanel>
            <LabelPanel>
                <Mail
                    size={24}
                    title={'Contact'}
                    color={'#3f72af'}
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
            tags: {
                [name: string]: Tag;
            };
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
    onSettingCurrentTag: (tag: Tag) => actions.setCurrentTag(tag),
    onSettingSelectedItemEmpty: () => actions.setSelectedItemEmpty()
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & {
    open: boolean;
    setOpen(): void;
};

export default connector(React.memo(Sidebar));
