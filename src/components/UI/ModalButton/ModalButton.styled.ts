import styled from 'styled-components';
import { device } from '../../../templates/MediaQueries/MediaQueries';

export const Button = styled.button`
    width: 30%;
    height: 75%;
    background-color: transparent;
    border: 2px solid #3f72af;
    border-radius: 5px;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.25);
    color: black;
    outline: none;
    font-family: 'Open Sans Condensed', sans-serif;
    font-size: 1rem;
    margin: 3% 5% 0 5%;
    transition: all 0.4s ease;
    backface-visibility: hidden;

    &:hover {
        transform: translateY(-7%);
    }

    @media only screen and (min-width: 2200px) {
        font-size: 2rem;
        height: 85%;
    }

    @media only screen and ${device.tablet} {
        width: 40%;
        font-size: 0.9rem;
    }

    @media only screen and ${device.mobileM} {
        width: 60%;
    }
`;
