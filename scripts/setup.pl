#!/usr/bin/perl

use strict;

my $DRYRUN = 0;
my $PATH = "../public/js";
my $TARGET_FILE = "game.js";
my @FILE_LIST = qw/
	header.js
	util.js
	const.js
	ajax.js
	config.js
	map.js
	attr.js
	ai.js
	chara.js
	ui.js
	battle.js
	entry.js
/;

sub main {
	if ($ARGV[0]) {
		$PATH = $ARGV[0];
	}
	_runCmd("rm $PATH/$TARGET_FILE");
	for my $file (@FILE_LIST) {
		_runCmd("cat $PATH/$file >> $PATH/$TARGET_FILE");	
	}
}

sub _runCmd {
	my ($cmd) = @_;
	print "Execute $cmd ...\n";
	if (!$DRYRUN) {
		`$cmd`;
	}
}

&main();


