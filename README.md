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


