import React, { forwardRef } from 'react';
import { connect } from 'react-redux';
import { Wrapper } from './ListDetails.styled';
import Name from '../../components/Details/Name/Name';
import DateContainer from '../../components/Details/Date/DateContainer';
import Completed from '../../components/Details/Completed/Completed';
import Notes from '../../components/Details/Notes/Notes';
import { Item } from '../../types';

const Details = forwardRef(
    (props: { selectedItem: Item }, ref: React.Ref<HTMLDivElement>) => {
        // TODO add return to top button in mobile

        return (
            <Wrapper ref={ref}>
                <Name />
                <DateContainer />
                <Completed />
                <Notes />
            </Wrapper>
        );
    }
);

const mapStateToProps = (state: {
    list: {
        selectedItem: Item;
    };
}) => {
    return {
        selectedItem: state.list.selectedItem
    };
};

export default connect(mapStateToProps)(Details);
