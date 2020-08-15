import React, { useState, useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import * as actions from '../../store/actions';
import Sidebar from '../../containers/Sidebar/Sidebar';
import ListLayout from '../../containers/ListLayout/ListLayout';
import ListDetails from '../../containers/ListDetails/ListDetails';
import { hiddenListContext } from '../../context/hiddenListContext';
import { Item } from '../../types';
import { Placeholder, Wrapper } from './List.styled';
import './List.css';
import Burger from '../../components/Sidebar/Burger/Burger';

const { Provider } = hiddenListContext;

const List: React.FC<PropsFromRedux> = (props) => {
    const { selectedItem, mobile, onSettingMobile, currentList } = props;

    const [hidden, setHidden] = useState(false);
    const [open, setOpen] = useState(false);

    const handleClick = (value: boolean) => {
        setHidden(value);
    };

    const openHandler = () => {
        setOpen(!open);
    };

    const updateMedia = () => {
        onSettingMobile(window.innerWidth <= 768);
    };

    useEffect(() => {
        window.addEventListener('resize', updateMedia);
        return () => {
            window.removeEventListener('resize', updateMedia);
        };
    });

    return (
        <Provider value={{ hidden, handleClick }}>
            {mobile ? <Burger open={open} setOpen={openHandler} /> : null}
            <Sidebar open={open} setOpen={openHandler} />
            <Wrapper>
                {currentList ? (
                    <>
                        <ListLayout selected={!!selectedItem.id} />
                        <ListDetails selected={!!selectedItem.id} />
                    </>
                ) : (
                    <Placeholder>
                        Select a list or a tag in the sidebar on the left.
                    </Placeholder>
                )}
            </Wrapper>
        </Provider>
    );
};
const mapStateToProps = (state: {
    list: {
        selectedItem: Item;
        currentList: string;
    };
    user: {
        mobile: boolean;
    };
}) => {
    return {
        selectedItem: state.list.selectedItem,
        currentList: state.list.currentList,
        mobile: state.user.mobile
    };
};

const mapDispatchToProps = {
    onSettingMobile: (mobile: boolean) => actions.setMobile(mobile)
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(React.memo(List));
