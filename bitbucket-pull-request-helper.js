// ==UserScript==
// @name Bitbucket Pull-Request Helper
// @namespace bitbucket
// @description Show whitespaces in Bitbucket pull-requests
// @grant none
// @author sgrigorjev
// @license MIT
// @version 1.1.0
// @include https://bitbucket.org/*
// ==/UserScript==
(function(window, undefined){

....var whitespaceStyle = 'color:#999; line-height: inherit';
....var YAMLErrorLineColor = 'red';
....var initInterval = 200;
....var expandSectionInterval = 100;
....
....var codeBlockMask = 'section.commentable-diff, section.bb-udiff';
....var expandBtnMask = 'span.ellipsis';

....var files = {};

....function encodeLine() {
........var i = 1,
............state = true, 
............source = this.innerHTML,
............leadsymbol = source[0],
............leadspaces = 0,
............leadstabs = 0,
............opentag = null,
............closetag = null,
............repLength = 0;
............repSource = '';

........do {
............switch (source[i]) {
................case '\t':
....................repSource += '\u2192   ';
....................repLength++;
....................leadstabs++;
....................i++;
....................break;
................case ' ':
....................repSource += '\u00B7';
....................repLength++;
....................leadspaces++;
....................i++;
....................break;
................case '<':
....................closetag = source.substring(i, 6);
....................opentag = closetag.substring(0, 5);
....................if (opentag === '<ins>' || opentag === '<del>') {
........................repSource += opentag;
........................repLength += 5;
........................i += 5;
....................} else if (closetag === '</ins>' || closetag === '</del>') {
........................repSource += closetag;
........................repLength += 6;
........................i += 6;
....................} else {
........................state = false;
....................}
....................break;
................default:
....................state = false;
....................break;
............}
........} while(state);

........if (repLength > 0) {
............this.innerHTML = leadsymbol + '<span style="' + whitespaceStyle + '">' + repSource + '</span>' + source.substring(repLength + 1);
........}

........this.setAttribute('data-encoded', 'true');

........return {
............leadsymbol: leadsymbol,
............leadstabs: leadstabs,
............leadspaces: leadspaces
........};
....}

....function encodeSection($section) {
........$section.find('pre.source:not([data-encoded])').each(function(){
............var filename = $section.attr('id');
............var file = files[filename];
............var info = encodeLine.call(this);
............file.leadstabs += info.leadstabs;
............file.leadspaces += info.leadspaces;
............// highlight tabs in YAML files
............if (info.leadstabs > 0 && /\.yml$/.test(filename)) {
................$(this).siblings('.gutter').css('background-color', YAMLErrorLineColor);
............}
........});
....}

....function init() {
........$(codeBlockMask).each(function(){
............var $section = $(this);
............files[$section.attr('id')] = {
................leadstabs: 0,
................leadspaces: 0
............};
............encodeSection($section);
............$section.on('click', expandBtnMask, function(){
................waitExpandSection($section, $section.height());
............});
........});
....}

..../**
.... * @deprecated
.... */
....function waitInit() {
........window.setTimeout(function(){
............if ($(codeBlockMask).length) {
................init();
............} else {
................waitInit();
............}
........}, initInterval);
....}

....function waitExpandSection($section, height) {
........window.setTimeout(function(){
............if ($section.height() > height) {
................encodeSection($section);
............} else {
................waitExpandSection($section, height);
............}
........}, expandSectionInterval);
....}

....switch (true) {
........// pull-request page
........case /^\/.+\/.+\/pull-requests\/\d+/.test(window.location.pathname):
............$('#pr-tab-content').on('diff:loaded', function(){
................init();
............});
............break;
........// new pull-request page
........case /^\/.+\/.+\/pull-requests\/new/.test(window.location.pathname):
............$(document).on("ajaxComplete", function(event, response, info){
................if (/^\/.+\/.+\/compare\//.test(info.url)) {
....................init();
................}
............});
............break;
........// branch page
........case /^\/.+\/.+\/branch\/.+/.test(window.location.pathname):
............$(document).on("ajaxComplete", function(event, response, info){
................if (/^\/.+\/.+\/branches\/diff\/.+/.test(info.url)) {
....................init();
................}
............});
............break;
....}

})(window);