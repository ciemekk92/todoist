import React, { useState, forwardRef, useContext, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { hiddenListContext } from '../../context/hiddenListContext';
import { Wrapper, ListContainer, Label } from './ListLayout.styled';
import ListInput from '../../components/List/ListInput/ListInput';
import SubmitButton from '../../components/List/SubmitButton/SubmitButton';
import DatePicker from '../DatePicker/DatePicker';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ListItem from '../../components/List/ListItem/ListItem';
import { updateObject } from '../../shared/utility';
import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../../firebase/firebase';
import firebase from 'firebase';
import * as actions from '../../store/actions';
import './ListLayout.css';
import { Item } from '../../types';
import { sizeNumber } from '../../templates/MediaQueries/MediaQueries';

const ListLayout = forwardRef(
    (props: Props, ref: React.Ref<HTMLInputElement>) => {
        const {
            onGettingUserInfo,
            onSelectingItem,
            onSelectingItemEmpty,
            lists,
            date,
            currentList,
            selectedItem,
            selected
        } = props;

        // TODO check for not empty input

        const [editing, setEditing] = useState(false);

        const initialItem = {
            value: '',
            id: '',
            date: new Date(),
            completed: false,
            notes: []
        };
        const [inputItem, setInputItem] = useState(initialItem);

        const { hidden } = useContext(hiddenListContext);

        const inputChangedHandler = (event: React.ChangeEvent) => {
            const target = event.target as HTMLInputElement;
            const updatedData = updateObject(inputItem, {
                value: target.value,
                id: uuidv4()
            });
            setInputItem(updatedData);
            setEditing(true);
        };

        const clearInput = () => {
            setInputItem(initialItem);
        };

        let keyCompleted = `lists.${currentList}.listItems.completed`;
        let keyNotCompleted = `lists.${currentList}.listItems.notCompleted`;

        const saveNewItem = async (newItem: Item) => {
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const newItemWithDate = updateObject(newItem, {
                date: date
            });
            try {
                await docRef
                    .update({
                        [keyNotCompleted]: firebase.firestore.FieldValue.arrayUnion(
                            newItemWithDate
                        )
                    })
                    .catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            }
        };

        const deleteItem = async (id: string, completed: boolean) => {
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const itemToRemove = completed
                ? lists[currentList].listItems.completed.filter(
                      (item: Item) => item.id === id
                  )
                : lists[currentList].listItems.notCompleted.filter(
                      (item: Item) => item.id === id
                  );
            const deleteKey = completed ? keyCompleted : keyNotCompleted;
            try {
                await docRef
                    .update({
                        [deleteKey]: firebase.firestore.FieldValue.arrayRemove(
                            itemToRemove[0]
                        )
                    })
                    .catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            }
        };

        const completeItem = async (id: string) => {
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const itemToRemove = lists[
                currentList
            ].listItems.notCompleted.filter((item: Item) => item.id === id);
            try {
                await docRef.update({
                    [keyNotCompleted]: firebase.firestore.FieldValue.arrayRemove(
                        itemToRemove[0]
                    )
                });
                const updatedItem = updateObject(itemToRemove[0], {
                    completed: true
                });
                if (selectedItem.id) {
                    onSelectingItem(updatedItem);
                }
                await docRef
                    .update({
                        [keyCompleted]: firebase.firestore.FieldValue.arrayUnion(
                            updatedItem
                        )
                    })
                    .catch((error) => console.log(error))
                    .then((response) => listUpdateHandler())
                    .catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            }
        };

        const listUpdateHandler = () => {
            onGettingUserInfo();
            clearInput();
            setEditing(false);
        };

        const dummyRef = useRef(null);

        const scrollToBottom = (ref: any) => {
            if (window.innerWidth <= sizeNumber.tablet) {
                ref.current.scrollIntoView({ behavior: 'smooth' });
            }
        };

        const selectItemHandler = (item: Item, ref: any) => {
            if (item.id !== selectedItem.id) {
                onSelectingItem(item);
                setTimeout(() => {
                    scrollToBottom(ref);
                }, 10);
            } else {
                onSelectingItemEmpty();
            }
        };

        const mapHandler = (listArray: Item[], completed: boolean) => {
            return (
                listArray
                    .slice()
                    // sort alphabetically
                    .sort((a: Item, b: Item) => (a.value > b.value ? 1 : -1))
                    // sort by date - finished recently first for completed items, to be finished first as first for not completed
                    .sort((a: Item, b: Item) =>
                        completed
                            ? new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                            : new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                    )
                    .map((element: Item) => (
                        <CSSTransition
                            key={element.id}
                            timeout={600}
                            classNames="move"
                            mountOnEnter
                            unmountOnExit
                        >
                            <ListItem
                                name={element.value}
                                date={element.date}
                                completed={element.completed}
                                selected={selectedItem.id === element.id}
                                clicked={() =>
                                    selectItemHandler(
                                        {
                                            id: element.id,
                                            value: element.value,
                                            date: element.date,
                                            completed: element.completed,
                                            notes: element.notes
                                        },
                                        dummyRef
                                    )
                                }
                                clickedComplete={() => completeItem(element.id)}
                                clickedDelete={() =>
                                    deleteItem(
                                        element.id,
                                        element.completed
                                    ).then((response) => listUpdateHandler())
                                }
                            />
                        </CSSTransition>
                    ))
            );
        };

        return (
            <Wrapper selected={selected}>
                <ListInput
                    ref={ref}
                    submit={() => {
                        saveNewItem(inputItem).then((response) =>
                            listUpdateHandler()
                        );
                    }}
                    changed={inputChangedHandler}
                    value={inputItem.value}
                    editing={editing}
                />
                <SubmitButton
                    clicked={() => {
                        saveNewItem(inputItem).then((response) =>
                            listUpdateHandler()
                        );
                    }}
                >
                    Add new list item
                </SubmitButton>
                <DatePicker type="layout" />
                <ListContainer>
                    <TransitionGroup className={'list'}>
                        {!lists[currentList]
                            ? null
                            : hidden
                            ? null
                            : mapHandler(
                                  lists[currentList].listItems.notCompleted,
                                  false
                              )}
                        {!lists[currentList]
                            ? null
                            : hidden
                            ? null
                            : mapHandler(
                                  lists[currentList].listItems.completed,
                                  true
                              )}
                    </TransitionGroup>
                </ListContainer>
                <div ref={dummyRef} />
            </Wrapper>
        );
    }
);

const mapStateToProps = (state: {
    user: { userInfo: { lists: any } };
    list: { currentList: any; date: any; selectedItem: Item };
}) => {
    return {
        lists: state.user.userInfo.lists,
        currentList: state.list.currentList,
        date: state.list.date,
        selectedItem: state.list.selectedItem
    };
};

const mapDispatchToProps = {
    onGettingUserInfo: () => actions.initUserInfo(),
    onSelectingItem: (item: Item) => actions.setSelectedItem(item),
    onSelectingItemEmpty: () => actions.setSelectedItemEmpty()
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & { selected: boolean };

export default connector(React.memo(ListLayout));
