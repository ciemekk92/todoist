import * as actionTypes from './actionTypes';
import { getUserDoc } from '../../firebase/firebase';
import { userInfo } from '../types/types';
import { alertError } from '../../shared/utility';

export const setUserInfo = (userInfo: userInfo) => {
    return {
        type: actionTypes.SET_USER_INFO,
        userInfo: userInfo
    };
};

export const fetchUserInfoFailed = (error: any) => {
    return {
        type: actionTypes.FETCH_USER_INFO_FAILED,
        error: error
    };
};

export const enableLoading = () => {
    return {
        type: actionTypes.ENABLE_LOADING
    };
};

export const disableLoading = () => {
    return {
        type: actionTypes.DISABLE_LOADING
    };
};

export const setMobile = (mobile: boolean) => {
    return {
        type: actionTypes.SET_MOBILE,
        mobile: mobile
    };
};

export const initUserInfo = () => {
    return (dispatch: any) => {
        dispatch(enableLoading());
        getUserDoc(localStorage.getItem('currentUser'))
            .then((response: any) => {
                dispatch(setUserInfo(response));
                dispatch(disableLoading());
            })
            .catch((error) => {
                dispatch(fetchUserInfoFailed(error));
                alertError('');
                dispatch(disableLoading());
            });
    };
};
