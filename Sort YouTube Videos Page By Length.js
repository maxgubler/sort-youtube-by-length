// ==UserScript==
// @name         Sort YouTube Videos Page By Length
// @namespace    https://github.com/maxgubler/
// @version      0.3.0
// @description  Loads all videos and sorts by length
// @author       Max Gubler
// @match        https://www.youtube.com/*/videos*
// @run-at       document-start
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

function sortAndUpdateDOM(order) {
    // Get HTMLCollection of list items
    var liCollection = document.getElementsByClassName('browse-list-item-container');
    var length = liCollection.length;

    // Populate array with objects containing the original position, time length in seconds, and the respective list item element
    var arrayOfObjects = [];

    for (var i = 0; i < length; i++) {
        var timeStr = liCollection[i].getElementsByClassName('video-time')[0].innerText;
        arrayOfObjects.push({originalPosition: i, time: hmsToSeconds(timeStr), element: liCollection[i]});
    }

    // Sort: 0 is ascending and 1 is descending
    if (order == 0) {
        arrayOfObjects.sort(function(a, b){return a.time - b.time});
    }
    else if (order == 1) {
        arrayOfObjects.sort(function(a, b){return b.time - a.time});
    }

    // Retain the first list item (subnavigation) html
    var subNav = document.querySelector('#browse-items-primary>li');
    var newHTML = subNav.outerHTML;

    // Construct new HTML list from sorted arrayOfObjects
    arrayOfObjects.forEach(function(obj) {
        newHTML += obj.element.outerHTML;
    });

    document.getElementById('browse-items-primary').innerHTML = newHTML;
}

// Load all videos
function start(order) {
    var firstClick = 0;

    // Select the node that will be observed for mutations
    var targetNode = document.body;

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, attributeOldValue: true, characterData: true, characterDataOldValue: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
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
                    sortAndUpdateDOM(order);
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

function fixSubnavList(order){
    var ytUser = document.querySelector('#appbar-nav>a').attributes.href.value;

    if (order == 0) {
        // Replace button text with selected sort option
        document.querySelector('.subnav-sort-menu .yt-uix-button-content').innerText = 'Length (ascending)';
        // Restore Date added (newest) as a list item
        document.querySelectorAll('.subnav-sort-menu li')[2].innerHTML = "<span href=\"" + ytUser + "/videos?sort=dd&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Date added (newest)</span>"
    }
    else if (order == 1) {
        // Replace button text with selected sort option
        document.querySelector('.subnav-sort-menu .yt-uix-button-content').innerText = 'Length (descending)';
        // Restore Date added (newest) and Length (ascending) as a list items
        document.querySelectorAll('.subnav-sort-menu li')[2].innerHTML = "<span href=\"" + ytUser + "/videos?sort=dd&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Date added (newest)</span>"
        document.querySelectorAll('.subnav-sort-menu li')[3].innerHTML = "<span href=\"" + ytUser + "/videos?sort=la&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Length (ascending)</span>"
    }
}

function hideListItems() {
    var li = document.querySelector('#browse-items-primary>li');
    var hideLi = '<style>.feed-item-container {opacity: 0;}</style>';
    li.insertAdjacentHTML('beforebegin', hideLi);
    li.after(document.querySelector('.browse-items-load-more-button'));
}

function getUrlVar() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function evaluateUrl() {
    var urlVar = getUrlVar().sort;

    if (urlVar == 'la') {
        hideListItems();
        fixSubnavList(0);
        start(0);
    }
    else if (urlVar == 'ld') {
        hideListItems();
        fixSubnavList(1);
        start(1);
    }
}

function createMenuOptions() {
    var ul = document.querySelector('.subnav-sort-menu>ul');
    var ytUser = document.querySelector('#appbar-nav>a').attributes.href.value;

    ul.innerHTML += "<li role=\"menuitem\"><span href=\"" + ytUser + "/videos?sort=la&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Length (ascending)</span></li>";
    ul.innerHTML += "<li role=\"menuitem\"><span href=\"" + ytUser + "/videos?sort=ld&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Length (descending)</span></li>";
}

function createMenuOnNavigation() {
    // Select the node that will be observed for mutations
    var targetNode = document.body;

    // Options for the observer (which mutations to observe)
    var config = { attributes: true };

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            if (mutation.attributeName == 'data-spf-name'){
                createMenuOptions();
                evaluateUrl();
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

function main() {
    createMenuOnNavigation();
    createMenuOptions();
    // Evaluate and start if sorting by length
    evaluateUrl();
}

function preLoad() {
    var hiddenLi = 0;
    var mutationObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Hide list items before loading them
            if (hiddenLi == 0 && mutation.target == document.querySelector('#browse-items-primary>li')) {
                hiddenLi = 1;
                main();
            }
            // Check for body page-loaded class to begin
            if (mutation.target == document.documentElement && document.querySelector('.page-loaded')){
                mutationObserver.disconnect();
                return;
            }
        });
    });
    // Starts listening for changes in the root HTML element of the page.
    mutationObserver.observe(document.documentElement, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true
    });
}

(function() {
    'use strict';
    preLoad();
})();
