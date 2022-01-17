# browser-tabs


The repository contains source code for two parts of a url collection service. These are the following:

* A browser extension allow users to collect tabs
* A web server that stores and organizes the tabs using basic (rudimentary) machine learning algorithms.


The browser extension has beeb tested in Chrome browsers and Firefox.

The web server is a node.js server that interacts with the extension, a user dashboard, and an administrator panel. 

The web server keeps tables in files. It does not use a mainstream database.

This is all meant for a small operation. I have a server running on a node in my home base server stack. The stack included very small servers, SBC boards with Flash storage.

### The extension allows users to select a web server URL.

The extensions allows a user to select which home server to use. As such, the repository has a purpose for DIY service providers:

### Purpose

> The purpose of this repository is to allow server owners to set up their own tab management services. There is (will be) a way for the exentsion interface to find the server


## What the server does

The current version of the server is fairly simplistic.

**Amdin:** It has a few admin commands for managing users, installing plugins, backing up the current user tables, and a shutdown function. (The server does not have a startup command - sort of joke - but just in case you were wondering.)

**User:** There are a collection of commands for the extension to interact with the server

 


## What the extension does

This extension includes a browser action with a popup specified as popup/tab-senses.html

1) The popup allows the user to gather tabs from open windows.
2) Save the tabs in a copious.world user account, where the are organzed by topic
3) fetch tabs from the user account by topic
4) open a user account page

# Users Accounts

The extensions will check cookies for user account verification.

A user account will be required to fetch tabs or do further tab categorization and managent.

Tabs may be saved away within copiou.world for a limited time until a user account is established. Once a user account is established, tabs may be pinned or removed by the user.


## Web Page Interfaces

### Popup Interface

### User Dashboard

# Admin Operations



## Web Page Interfaces

There is just one admin page for this server. It is developed independently from other code in any of the projects. It does not do too much. It is written in vanilla javascript and html. 

### Admin Dashboard

#### <u>Operations available from the admin dashboard</u>

#####Top Level Operations

* list users
* backup
* reload
* shutdown

#####User operations

* fetch info
* list user content (domains, topics, window)
* block/unblock

# Dev Topics

Here are some areas to consider if you hack the code.

## Javascript Files and Manifests

In the top of the repository are files for the server and directories for versions of the extension popup.

### Extension Files

The extension implementations are the following:

* Chrome come-to-my-tab-senses-chrome
* Mozilla come-to-my-tab-senses

Every attempt has been made to make the two implementations be the same code. In fact, before any small changes, the files in the **popup** directory are copies made by using the file system copy commands (cut and paste). At the top of the javascript files you should find a constant definition:

```
const copious = chrome
```

That is for the **chrome** exntensions. Here is another:

```
const copious = browser
```

That is for **mozilla** or Firefox.

### Web page injection

In the manisfests, the field "content_scripts" is defined with ***tab-catcher.js*** being the target. The script can be found at the top level of the extenstion directory. 

This script is only injected in to pages on copious.world or popsong.now.  The dashboards for those URL's may offer up some features yet to be defined.

The script is not set to be injected on any other page from any other domain. So, there is no attempt to interfere with operations on any sites that this author has no control over nor any business messing with.

The main purpose of the ***tab-catcher.js*** is to populate the email (user id) on the extension with an ID taken from the hosting page. 

Also, ***tab-catcher.js*** will take in topics from the extension popup directly, without a trip to the server and forward them to the hosting page. This function may be mute or just nice to have. The server will operate with a websocket to push data to pages that are up and in use. 




