// Types d'actions pour l'authentification
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAIL = 'REGISTER_FAIL';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';
export const LOGOUT = 'LOGOUT';
export const USER_LOADED = 'USER_LOADED';
export const AUTH_ERROR = 'AUTH_ERROR';

// Types d'actions pour les forums
export const GET_FORUMS = 'GET_FORUMS';
export const GET_FORUM = 'GET_FORUM';
export const CREATE_FORUM = 'CREATE_FORUM';
export const UPDATE_FORUM = 'UPDATE_FORUM';
export const DELETE_FORUM = 'DELETE_FORUM';
export const FORUM_ERROR = 'FORUM_ERROR';

// Types d'actions pour les messages
export const GET_MESSAGES = 'GET_MESSAGES';
export const GET_MESSAGE = 'GET_MESSAGE';
export const CREATE_MESSAGE = 'CREATE_MESSAGE';
export const REPLY_TO_MESSAGE = 'REPLY_TO_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const DELETE_MESSAGE = 'DELETE_MESSAGE';
export const MESSAGE_ERROR = 'MESSAGE_ERROR';
export const SEARCH_MESSAGES = 'SEARCH_MESSAGES';

// Types d'actions pour les profils
export const GET_PROFILE = 'GET_PROFILE';
export const UPDATE_PROFILE = 'UPDATE_PROFILE';
export const PROFILE_ERROR = 'PROFILE_ERROR';
export const GET_USER_MESSAGES = 'GET_USER_MESSAGES';

// Types d'actions pour l'administration
export const GET_PENDING_USERS = 'GET_PENDING_USERS';
export const VALIDATE_USER = 'VALIDATE_USER';
export const REJECT_USER = 'REJECT_USER';
export const SET_ADMIN_STATUS = 'SET_ADMIN_STATUS';
export const ADMIN_ERROR = 'ADMIN_ERROR';

// Types d'actions pour la gestion des erreurs
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';

// Types d'actions pour le loading
export const SET_LOADING = 'SET_LOADING';
export const CLEAR_LOADING = 'CLEAR_LOADING'; 