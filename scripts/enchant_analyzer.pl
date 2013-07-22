#!/usr/bin/perl

use strict;
use Data::Dumper;

my $DETAIL = 0;
my $PATH = "../public/js/lib/enchant.js";

my $class_tree = +{
	Class => +{},
};

my $class_method = +{};

sub loadFile {
	my ($file) = @_;
	
	my $cur_class;
	open FILE, "<$file" or die "can not open file";
	while(my $line = <FILE>) {
		#print $line;
		chomp($line);

		if ($line =~ /enchant\.(.*) = enchant.Class.create\((.*)\{/) {
			my ($child, $parent) = ($1, $2);
			if ($parent =~ /enchant\.(.*),/) {
				$parent = $1;
			} else { 
				$parent = "Class";
			}
			$class_tree->{$parent}->{$child} = 1;
			$cur_class = $child;
		}
		if ($line =~ /(\S*): function.*/) {
			my $method = $1;
			if ($method =~ /\d+/ || $method eq "get" || $method eq "set") {
				next;
			}
			if ($cur_class eq '' ) {
				$cur_class = "global";
			}
			push @{$class_method->{$cur_class}}, $method;		
		} 
	}
	close FILE;
}

# A BFS Print out
sub output_bfs {
	for my $class (keys %{$class_tree->{Class}}) {
		$class_tree->{Class}
	}
	my @queue = ();
	push @queue, +{name => 'Class', layer => 1};
	while (scalar(@queue) > 0) {
		my $class = shift @queue;
		print "  " x ($class->{layer} - 1), $class->{name},"\n";	
		#print "$class->{layer} : $class->{name}\n";
		
		push @queue, 
			map { +{
					name => $_, 
					layer => $class->{layer} + 1
					}
				} keys %{$class_tree->{$class->{name}}};
	}
}

sub output_dfs {
	my ($class, $depth) = @_;

	for (my $i = 1; $i < $depth; $i++) {
		print "| ";
	}
	
	if ($depth > 0) {
		print "|-";
	}
	print $class, "\n";
	
	if ($DETAIL) {
		for my $method (@{$class_method->{$class}}) {
			output_method($class, $method, $depth);
		}
	}

	return if (! defined $class_tree->{$class});
	
	for my $sub_class (keys %{$class_tree->{$class}}) {
		output_dfs($sub_class, $depth + 1);
	}
}

sub output_method {
	my ($class, $method, $depth) = @_;
	for (my $i = 1; $i < $depth; $i++) {
		print "| ";
	}

	if (scalar(keys %{$class_tree->{$class}})) {
		print "| | @", $method, "\n";
	} else {
		print "|   @", $method, "\n";
	}	
}

sub main {
	my $dHash = loadFile($ARGV[0] ? $ARGV[0] : $PATH);
	#print Dumper $class_tree;
	output_dfs('Class', 0);
}

main();
