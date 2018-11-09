// ==UserScript==
// @name         Sort YouTube Videos Page By Length
// @namespace    https://github.com/maxgubler/
// @version      0.4.1
// @description  Loads all videos and sorts by length
// @author       Max Gubler
// @match        https://www.youtube.com/*
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
    console.log('Start loading videos...');
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
    console.log('Fixing subnavigation list');
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
    if (li) {
        console.log('Is li ready: Yes, hiding list items!');
        var hideLi = '<style>.feed-item-container {opacity: 0;}</style>';
        li.insertAdjacentHTML('beforebegin', hideLi);

        var loadButton = document.querySelector('.browse-items-load-more-button');
        loadButton.innerHTML = '<span class="yt-uix-button-content"><span class="load-more-loading"><span class="yt-spinner"><span class="yt-spinner-img  yt-sprite" title="Loading icon"></span> Loading...</span></span><span class="load-more-text hid" style="display: none;"> Load more</span></span>'
        li.after(document.querySelector('.browse-items-load-more-button'));

        return true;
    }
    else {
        console.log('Is li ready: No li found, return false');
        return false;
    }
}

function evaluateSort(parsedUrl) {
    var sort = parsedUrl.searchParams.get('sort');

    if (sort == 'la') {
        if (hideListItems()) {
            fixSubnavList(0);
            start(0);
        }
        else {
            return false;
        }
    }
    else if (sort == 'ld') {
        if (hideListItems()) {
            fixSubnavList(1);
            start(1);
        }
        else {
            return false;
        }
    }
    else {
        console.log('Not sorting by length: Do not sort.');
    }
}

function insertSubnavMenuOptions(ul) {
    var ytUser = document.querySelector('#appbar-nav>a').attributes.href.value;
    ul.innerHTML += "<li role=\"menuitem\"><span href=\"" + ytUser + "/videos?sort=la&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Length (ascending)</span></li>";
    ul.innerHTML += "<li role=\"menuitem\"><span href=\"" + ytUser + "/videos?sort=ld&amp;view=0&amp;flow=list\" onclick=\";yt.window.navigate(this.getAttribute('href'));return false;\" class=\" yt-uix-button-menu-item spf-link\">Length (descending)</span></li>";
}

function editDOM(parsedUrl) {
    var ul = document.querySelector('.subnav-sort-menu>ul');

    console.log('Attempt to insert subnavigation menu options...');
    if (ul) {
        console.log('Subnav ul ready: Create subnav menu options!');
        insertSubnavMenuOptions(ul);
        console.log('Sort by length?');
        evaluateSort(parsedUrl);
        return true;
    }
    else {
        console.log('Subnav ul not ready: Wait for mutation...');
        return false;
    }
}

function validateUrl() {
    var parsedUrl = new URL(window.location.href);
    var pathnameArray = parsedUrl.pathname.split('/');

    if (pathnameArray[pathnameArray.length - 1] == 'videos') {
        return parsedUrl;
    }
    else {
        return false;
    }
}

function preLoad() {
    var parsedVideosUrl = false;
    var liMutated = false;

    var mutationObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // When navigation is detected, check if location is videos page
            if (mutation.attributeName == 'data-spf-name'){
                console.log('------- YouTube Navigation Detected -------');

                console.log('Evaluate current navigation page...');
                parsedVideosUrl = validateUrl();

                if (parsedVideosUrl) {
                    console.log('Current page: Videos');
                    editDOM(parsedVideosUrl);
                }
                else {
                    console.log('Current page: Not videos. Do nothing.');
                    return false;
                }
            }
            // Hide list items before loading them
            if (parsedVideosUrl && liMutated == false && mutation.target == document.querySelector('#browse-items-primary>li')) {
                liMutated = true;
                console.log('li mutation observered');
                editDOM(parsedVideosUrl);
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
