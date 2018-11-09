// ==UserScript==
// @name         Sort YouTube Videos Page By Length
// @namespace    https://github.com/maxgubler/
// @version      0.1
// @description  Loads all videos and sorts by length
// @author       Max Gubler
// @match        https://www.youtube.com/*/videos*
// @grant        none
// ==/UserScript==

function hmsToSeconds(str) {
    var p = str.split(':'), s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function sortAndUpdateDOM() {
    var liCollection = document.getElementsByClassName('browse-list-item-container');
    var length = liCollection.length;
    var arrayOfObjects = [];

    for (var i = 0; i < length; i++) {
        var timeStr = liCollection[i].getElementsByClassName('video-time')[0].innerText;
        arrayOfObjects.push({originalPosition: i, time: hmsToSeconds(timeStr), element: liCollection[i]});
    }

    arrayOfObjects.sort(function(a, b){return a.time - b.time});

    // Create subnavigation first
    var subNav = document.querySelector('#browse-items-primary>li');
    var newHTML = subNav.outerHTML;

    // Construct new HTML list from sorted arrayOfObjects
    arrayOfObjects.forEach(function(obj) {
        newHTML += obj.element.outerHTML;
    });

    document.getElementById('browse-items-primary').innerHTML = newHTML;
}

function start() {
    /* Display All Videos */
    var firstClick = 0;

    // Select the node that will be observed for mutations
    var targetNode = document.getElementById('body');

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, attributeOldValue: true, characterData: true, characterDataOldValue: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            //console.log(mutation);
            if (firstClick == 0 && document.querySelector('body.page-loaded')) {
                firstClick = 1;
                document.querySelector('.browse-items-load-more-button').click();
            }
            else if (mutation.type == 'attributes' && mutation.oldValue == 'load-more-text hid') {
                var button = document.querySelector('.browse-items-load-more-button');
                if (button){
                    button.click();
                }
                else {
                    observer.disconnect();
                    sortAndUpdateDOM();
                    return;
                }
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

/* TODO: Create drop-down button options, sort high to low or low to high and don't resort if already on sorted page--just reverse order */
/* TODO: Hide videos while sorting */
/* TODO: Try to optimize with fetch / getMoreContent */
/* TODO: Refactor out specific functions */
(function() {
    'use strict';

    start();

})();
