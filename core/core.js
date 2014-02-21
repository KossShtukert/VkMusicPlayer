var
    Port,
    Songs,
    LastActive,
    LastActiveIndex,
    FirstLoad,
    UpdateList;

/**
 * Main object
 *
 * @type {object} Object
 */
var Core = {};

Core.audioEvent = function() {
    var songs = document.getElementById('player-wrapper').getElementsByTagName('li');

    for(var i = 0, size = songs.length; i < size; i++) {
        var song = songs[i];

        song.addEventListener('click', Core.event.playSong);
    }
};

Core.play = function(e) {
    if(LastActiveIndex)
        Core.removeActiveIndex(LastActiveIndex);

    if(LastActive)
        LastActive.className = '';

    var element;

    if(e.target.nodeName == 'LI')
        element = e.target;
    else
        element = e.target.parentNode;

    var index = element.getAttribute('data-index');

    element.className = 'active';
    LastActive = element;

//    MFCore.set(Songs[index].url, Songs[index].duration);
};

Core.removeActiveIndex = function(index) {
    var i = index - 1;
    document.getElementById('player-wrapper').getElementsByTagName('li')[i].className = '';
};

/**
 * Highlight current song
 *
 * @param {number} index
 */
Core.setActiveByIndex = function(index) {
    var i = index - 1;
    document.getElementById('player-wrapper').getElementsByTagName('li')[i].className = 'active';
};

/**
 * Set song info into DOM
 *
 * @param {string} artist
 * @param {string} title
 * @param {number} totalTime
 */
Core.setSongInfo = function(artist, title, totalTime) {
    MFTimeAll.textContent = totalTime;
    MFArtist.textContent = artist;
    MFTitle.textContent = title;
};

/**
 * Events
 *
 * @type {object}
 */
Core.event = {};

/**
 * Create connection
 */
Core.event.connect = function() {
    Port = chrome.runtime.connect();
};

/**
 * Listen for data
 */
Core.event.listenData = function() {
    chrome.runtime.onConnect.addListener(function(bgPort) {
        Core.event.onOpen();
        bgPort.onMessage.addListener(function(msg) {
            console.log(msg);
            Core.event[msg.event](msg.data);
        });
    });
};

Core.event.send = function(data) {
    Port.postMessage(data);
};

Core.event.checkFirstLoad = function() {
    Core.event.send({
        event: 'checkFirstLoad',
        data: ''
    });
};

/**
 *  Init this load like first
 *
 * @param {object} data
 */
Core.event.setFirstLoadToTrue = function(data) {
    FirstLoad = data;
};

/**
 * Define that is not first load on this session
 *
 * @param {object} data
 */
Core.event.setFirstLoadToFalse = function(data) {
    FirstLoad = data;
};

/**
 * Play song
 */
Core.event.sendPlay = function() {
    Core.event.send({
        event: 'sendPlay',
        data: null
    });
};

Core.event.playSong = function(e) {
    var element;

    if(e.target.nodeName == 'LI')
        element = e.target;
    else
        element = e.target.parentNode;

    var index = element.getAttribute('data-index');

    MFTimeCurrent.textContent = '00:00';
    MFBuffer.style.width = 0;
    MFProgress.style.width = 0;

    Core.event.send({
        event: 'playByIndex',
        data: index
    });
};

Core.event.play = function(data) {
    MFPlay.addEventListener('click', function() {
        if(FirstLoad) {
            Core.event.sendPlay();
            FirstLoad = false;
        } else {
            if(MFPlay.classList.contains('pause')) {
                Core.event.send({
                    event: 'setToPause',
                    data: ''
                });
            } else {
                Core.event.send({
                    event: 'setToPlay',
                    data: ''
                });
            }
        }
    });
};

Core.event.getSongDuration = function() {
    Core.event.send({
        event: 'getSongDuration',
        data: ''
    });
};

Core.event.setSongDuration = function(data) {
    console.log(data);
    MFDuration = data;
};

Core.event.changeSongInfo = function(data) {
    Core.setSongInfo(data.artist, data.title, data.duration);
    MFDuration = data.realDuration;
};

Core.event.sendSetFirstActive = function(data) {
    Core.setActiveByIndex(1);
};

Core.event.timeUpdate = function(data) {
    MFTimeCurrent.textContent = data;
};

Core.event.changePlayToPause = function(data) {
    if(!MFPlay.classList.contains('pause'))
        MFPlay.className += ' pause';
};

/**
 *
 *
 * @param data
 */
Core.event.changePauseToPlay = function(data) {
    MFPlay.classList.remove('pause');
};

/**
 * Set width of progress bar element
 *
 * @param {string} data
 */
Core.event.setProgressBarWidth = function(data) {
    MFProgress.style.width = data;
};

/**
 * Set width of load process element
 *
 * @param {string} data
 */
Core.event.setLoadProgress = function(data) {
    MFBuffer.style.width = data;
};

/**
 * Highlight new active song in list
 *
 * @param {{oldIndex: number, newIndex: number}} data
 */
Core.event.setNewHighLightElement = function(data) {
    Core.removeActiveIndex(data.oldIndex);
    Core.setActiveByIndex(data.newIndex);
};

/**
 * Update list of audio
 */
Core.event.updateList = function() {
    Core.event.send({
        event: 'updateList',
        data: ''
    });
};

/**
 * Reload popup #wrapper element
 *
 * @param data
 */
Core.event.reloadContent = function(data) {
    console.log(document.getElementById('wrapper'));
    document.body.removeChild(document.getElementById('wrapper'));

    Core.loadBackgroundContent(true);
};

/**
 * Open window for authorization in VK.com
 */
Core.event.authorize = function() {
    Core.event.send({
        event: 'openAuth',
        data: ''
    });
};

/**
 * Send this event when popup will open
 */
Core.event.onOpen = function() {
    Core.event.checkFirstLoad();
    Core.event.getSongDuration();
};

/**
 * Auth user & get songs from background page
 */
Core.auth = function() {
    Core.loadBackgroundContent();
};

/**
 * Load background page
 *
 * @param {object} port
 */
Core.loadBackgroundContent = function(port) {
    chrome.runtime.getBackgroundPage(function(win) {
        var node = document.importNode(win.document.getElementById('wrapper'), true);
        document.body.appendChild(node);

        if(localStorage['authInfo'] != undefined) {
            Core.audioEvent();

            if(win.LastActiveIndex)
                LastActiveIndex = win.LastActiveIndex;

            MFCore.init();
            Core.setElements();
            Core.setEvents();

            if(!port) {
                Core.event.listenData();
                Core.event.connect();
            } else {
                Core.event.onOpen();
            }

            Core.event.play();
        } else {
            var authButton = document.getElementById('vk-auth');

            Core.event.listenData();
            Core.event.connect();
            console.log(Port);

            authButton.addEventListener('click', Core.event.authorize);
        }
    });
};

/**
 * Init events
 */
Core.setEvents = function() {
    UpdateList.addEventListener('click', Core.event.updateList);
};

/**
 * Init DOM elements
 */
Core.setElements = function() {
    UpdateList = document.getElementById('update-list');
};

/**
 * Init functions
 */
Core.init = function() {
    Core.auth();
};

window.addEventListener('DOMContentLoaded', Core.init);