#!/bin/sh
java -jar ../lib/compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js=../src/sm.Channel.js --js=../src/sm.channels.js --js_output_file=../sm.ChannelExtension.js --js_output_file=../sm.channels.min.js

java -jar ../lib/compiler.jar --compilation_level=WHITESPACE_ONLY --formatting=pretty_print --js=../src/sm.Channels.js --js=../src/sm.channels.js --js=../src/sm.ChannelExtension.js --js_output_file=../sm.channels.js
