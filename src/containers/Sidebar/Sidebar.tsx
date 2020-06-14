import React, { useState, useContext } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import firebase from 'firebase/app';
import { firestore } from '../../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { hiddenListContext } from '../../context/hiddenListContext';
import { updateObject } from '../../shared/utility';
import * as actions from '../../store/actions';
import useDidMountEffect from '../../hooks/useDidMountEffect';
import { Bar, LogoPlaceholder } from './Sidebar.styled';
import SidebarModal from '../../components/UI/Sidebar/SidebarModal/SidebarModal';
import NewListInput from '../../components/UI/Sidebar/NewList/NewListInput/NewListInput';
import PanelContainer from '../../components/UI/Sidebar/PanelContainer/PanelContainer';
import ListPanel from '../../components/UI/Sidebar/ListPanel/ListPanel';
import AddNewList from '../../components/UI/Sidebar/NewList/AddNewList';
import { Item, List } from '../../types';

const Sidebar: React.FC<PropsFromRedux> = (props) => {
    const {
        lists,
        selectedItem,
        selectedCurrentList,
        onSettingCurrentList,
        onGettingUserInfo,
        onSettingSelectedItemEmpty
    } = props;

    const [newList, setNewList] = useState({
        name: '',
        id: '',
        timestamp: 0,
        listItems: {
            completed: [],
            notCompleted: []
        }
    });

    const { handleClick } = useContext(hiddenListContext);

    const [addingList, setAddingList] = useState(false);

    const newListHandler = async (list: List) => {
        setAddingList(false);
        if (newList.name !== '') {
            const uid: any = localStorage.getItem('currentUser');
            const docRef = await firestore.collection('users').doc(uid);
            const listWithTimestamp = updateObject(list, {
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            let key = `lists.${list.name}`;

            try {
                await docRef
                    .update({
                        [key]: listWithTimestamp
                    })
                    .then((response) => onGettingUserInfo())
                    .catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            }
        }
    };

    const inputChangedHandler = (event: React.ChangeEvent) => {
        const target = event.target as HTMLInputElement;
        const updatedData = updateObject(newList, {
            name: target.value,
            id: uuidv4()
        });
        setNewList(updatedData);
    };

    const toggleAdding = () => {
        setAddingList(!addingList);
    };

    const currentListHandler = (list: string) => {
        if (list !== selectedCurrentList) {
            handleClick(true);
            onSettingCurrentList(list);
            if (selectedItem.id) {
                onSettingSelectedItemEmpty();
            }
            setTimeout(() => {
                handleClick(false);
            }, 500);
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
                .then((response) => console.log(response))
                .catch((error) => console.log(error));
        } catch (error) {
            console.log(error);
        }
    };

    const deleteListHandler = (list: string) => {
        deleteList(list).then((response) => onGettingUserInfo());
    };

    let listsArray = Object.keys(lists);

    useDidMountEffect(() => {
        onSettingCurrentList(listsArray[0]);
    }, [listsArray.length]);

    return (
        <Bar>
            <SidebarModal open={addingList} modalClosed={toggleAdding}>
                <NewListInput
                    changed={inputChangedHandler}
                    value={newList.name}
                    submit={() => newListHandler(newList)}
                />
            </SidebarModal>
            <LogoPlaceholder>Listify</LogoPlaceholder>
            <PanelContainer>
                {
                    // sort alphabetically
                    lists
                        ? listsArray
                              .slice()
                              .sort()
                              .map((element) => (
                                  <ListPanel
                                      active={selectedCurrentList === element}
                                      name={element}
                                      key={uuidv4()}
                                      clicked={() =>
                                          currentListHandler(element)
                                      }
                                      clickedDelete={() =>
                                          deleteListHandler(element)
                                      }
                                  />
                              ))
                        : null
                }
            </PanelContainer>
            <AddNewList
                clicked={
                    !addingList ? toggleAdding : () => newListHandler(newList)
                }
            />
        </Bar>
    );
};

const mapStateToProps = (state: {
    user: {
        userInfo: {
            lists: any;
        };
    };
    list: {
        currentList: any;
        selectedItem: Item;
    };
}) => {
    return {
        lists: state.user.userInfo.lists,
        selectedItem: state.list.selectedItem,
        selectedCurrentList: state.list.currentList
    };
};

const mapDispatchToProps = {
    onGettingUserInfo: () => actions.initUserInfo(),
    onSettingCurrentList: (list: string) => actions.setCurrentList(list),
    onSettingSelectedItemEmpty: () => actions.setSelectedItemEmpty()
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(React.memo(Sidebar));
