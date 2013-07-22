#!/usr/bin/perl

use strict;
#use warnings;
use Image::Magick;
use Data::Dumper;

my $CONFIG = +{
	UNIT_ATK => {
		w => 64,
		h => 64,
		width => 64 * 4,
		height => 64 * 4,
		frame => 4,
		img_num => 151,
		prefix => "Unit_atk_",
		postfix => "-1.bmp",
	},
	UNIT_MOV => {
		w => 48,
		h => 48,
		width => 48 * 2,
		height => 48 * 5,
		frame => 2,
		img_num => 151,
		prefix => "Unit_mov_",
		postfix => "-1.bmp",
	},
	UNIT_SPC => {
		w => 48,
		h => 48,
		width => 48 * 4,
		height => 48 * 3,
		frame => 1,
		img_num => 151,
		prefix => "Unit_spc_",
		postfix => "-1.bmp",
	},

	DIR => "unit",
	OUTPUT_DIR => "output",
};

sub unit_mov {
	my ($config) = @_;

	my $ret;
	my $w = $config->{w};
	my $h = $config->{h};
	my $width = $config->{width};
	my $height = $config->{height};
	my $frame = $config->{frame};
	my $img_num = $config->{img_num};
	my ($type, $side, $level);

	for (my $i = 1; $i <= $img_num; ++$i) {
		my $file = "$CONFIG->{DIR}/$config->{prefix}"
				.$i."$config->{postfix}";

		print STDERR "Processing $file ... \n";

		my $dst = Image::Magick->new;
		$ret = $dst->Read($file);
		warn "$ret\n" if $ret;
		$ret = $dst->Crop(geometry=>"1x1+0+0");
		warn "$ret\n" if $ret;
		$ret = $dst->Resize(width=>$width,height=>$height);
		warn "$ret\n" if $ret;

		my ($sx, $sy) = (0, 0);
		my ($dx, $dy) = (0, 0);
		for (my $l = 0; $l < 3; ++$l) {
			if ($l == 1) {
				$dy = 2 * $h;
			} elsif ($l == 2) {
				$dy = 3 * $h;
			}
	
			$dx = 0;
			#$dy = $l * $h;
			$sx = 0;
			$sy = (6 + $l) * $h;
			
			#my $src = Image::Magick->new;
			#$ret = $src->Read($file);
			#warn "$ret\n" if $ret;
			#$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
			#warn "$ret\n" if $ret;
				
			#$ret = $dst->Composite(
			#	image => $src,
			#	compose => 'Over',
			#	x => $dx,
			#	y => $dy
			#);
		

			#$dx += $w;
			$sy = $l * 2 * $h;
			for (my $j = 0; $j < $frame; ++$j) {
				my $src = Image::Magick->new;
				$ret = $src->Read($file);
				warn "$ret\n" if $ret;
				$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
				warn "$ret\n" if $ret;
				
				$ret = $dst->Composite(
					image => $src,
					compose => 'Over',
					x => $dx,
					y => $dy
				);
				$dx += $w;
				$sy += $h;
			}
		}

			my $l = 2;		
			$dx = 0;
			$dy = ($l + 1) * $h;
			$sx = 0;
			$sy = (6 + $l) * $h;
		
=cut
			my $src = Image::Magick->new;
			$ret = $src->Read($file);
			warn "$ret\n" if $ret;
			$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
			warn "$ret\n" if $ret;
			
			$ret = $src->Flop();
			warn "$ret\n" if $ret;
				
			$ret = $dst->Composite(
				image => $src,
				compose => 'Over',
				x => $dx,
				y => $dy
			);
=cut	

			($dx, $dy) = (0, $h);
			($sx, $sy) = (0, $h * 4);
			#$dx += $w;
			#$sy = $l * 2 * $h;
			for (my $j = 0; $j < $frame; ++$j) {
				my $src = Image::Magick->new;
				$ret = $src->Read($file);
				warn "$ret\n" if $ret;
				$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
				warn "$ret\n" if $ret;
			
				$ret = $src->Flop();
				warn "$ret\n" if $ret;
				
				$ret = $dst->Composite(
					image => $src,
					compose => 'Over',
					x => $dx,
					y => $dy
				);
				$dx += $w;
				$sy += $h;
			}



		$dx = 0;
		$dy = 4 * $h;
		$sx = 0;
		$sy = 9 * $h;
		for (my $j = 0; $j < $frame; ++$j) {
			my $src = Image::Magick->new;
			$ret = $src->Read($file);
			warn "$ret\n" if $ret;
			$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
			warn "$ret\n" if $ret;
			
			$ret = $dst->Composite(
				image => $src,
				compose => 'Over',
				x => $dx,
				y => $dy
			);
			$dx += $w;
			$sy += $h;
		}


		$ret = $dst->Transparent('#F700FF');
		warn "$ret\n" if $ret;

		my $outputPNG = "$CONFIG->{OUTPUT_DIR}/$config->{prefix}".$i.".png";
		$ret = $dst->Write("$outputPNG");
		warn "Write Failed $ret\n" if $ret;
	}

}


sub unit_atk {
	my ($config) = @_;

	my $ret;
	my $w = $config->{w};
	my $h = $config->{h};
	my $width = $config->{width};
	my $height = $config->{height};
	my $frame = $config->{frame};
	my $img_num = $config->{img_num};
	my ($type, $side, $level);

	for (my $i = 1; $i <= $img_num; ++$i) {
		my $file = "$CONFIG->{DIR}/$config->{prefix}"
				.$i."$config->{postfix}";

		print STDERR "Processing $file ... \n";

		my $dst = Image::Magick->new;
		$ret = $dst->Read($file);
		warn "$ret\n" if $ret;
		$ret = $dst->Crop(geometry=>"1x1+0+0");
		warn "$ret\n" if $ret;
		$ret = $dst->Resize(width=>$width,height=>$height);
		warn "$ret\n" if $ret;

		my ($sx, $sy) = (0, 0);
		my ($dx, $dy) = (0, 0);
		for (my $l = 0; $l < 3; ++$l) {
			if ($l == 1) {
				$dy = 2 * $h;
			} elsif ($l == 2) {
				$dy = 3 * $h;
			}
			for (my $j = 0; $j < $frame; ++$j) {
				my $src = Image::Magick->new;
				$ret = $src->Read($file);
				warn "$ret\n" if $ret;
				$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
				warn "$ret\n" if $ret;
				
				$ret = $dst->Composite(
					image => $src,
					compose => 'Over',
					x => $dx,
					y => $dy
				);
				$dx += $w;
				$sy += $h;
			}
			$dx = 0;
			#$dy += $h;
		}

			$dy = $h;
			$sy -= $frame * $h;
			# flip left to right
			for (my $j = 0; $j < $frame; ++$j) {
				my $src = Image::Magick->new;
				$ret = $src->Read($file);
				warn "$ret\n" if $ret;
				#warn "$w - $h - $sx - $sy \n";
				$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
				warn "$ret\n" if $ret;
			
				# flip here
				$ret = $src->Flop();
				warn "$ret\n" if $ret;

				$ret = $dst->Composite(
					image => $src,
					compose => 'Over',
					x => $dx,
					y => $dy
				);
				$dx += $w;
				$sy += $h;
			}

		$ret = $dst->Transparent('#F700FF');
		warn "$ret\n" if $ret;

		my $outputPNG = "$CONFIG->{OUTPUT_DIR}/$config->{prefix}".$i.".png";
		$ret = $dst->Write("$outputPNG");
		warn "Write Failed $ret\n" if $ret;
	}

}

sub unit_spc {
	my ($config) = @_;

	my $ret;
	my $w = $config->{w};
	my $h = $config->{h};
	my $width = $config->{width};
	my $height = $config->{height};
	my $frame = $config->{frame};
	my $img_num = $config->{img_num};
	my ($type, $side, $level);


	for (my $i = 1; $i <= $img_num; ++$i) {
		my $file = "$CONFIG->{DIR}/$config->{prefix}"
				.$i."$config->{postfix}";

		print STDERR "Processing $file ... \n";

		my $dst = Image::Magick->new;
		$ret = $dst->Read($file);
		warn "$ret\n" if $ret;
		$ret = $dst->Crop(geometry=>"1x1+0+0");
		warn "$ret\n" if $ret;
		$ret = $dst->Resize(width=>$width,height=>$height);
		warn "$ret\n" if $ret;

		my ($sx, $sy) = (0, 0);
		my ($dx, $dy) = (0, 0);

		my $mov_file = "$CONFIG->{DIR}/Unit_mov_"
				.$i."$config->{postfix}";

		# clip from move file
		
		# down
		($sx, $sy) = (0, $h * 6);
		my $src = Image::Magick->new;
		$ret = $src->Read($mov_file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# right
		$sx = 0;
		$sy = $h * 8;
		my $src = Image::Magick->new;
		$ret = $src->Read($mov_file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $src->Flop();
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# up
		$sx = 0;
		$sy = $h * 7;
		my $src = Image::Magick->new;
		$ret = $src->Read($mov_file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# left
		$sx = 0;
		$sy = $h * 8;
		my $src = Image::Magick->new;
		$ret = $src->Read($mov_file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;
		# read from spc file
		
		# down
		($sx, $sy) = (0, 0);
		($dx, $dy) = (0, $h);
		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# right
		($sx, $sy) = (0, $h * 2);
		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $src->Flop();
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# up
		($sx, $sy) = (0, $h);
		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		$dx += $w;

		# left
		($sx, $sy) = (0, $h * 2);
		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);

		($dx, $dy) = (0, $h * 2);
		($sx, $sy) = (0, $h * 3);
		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".$h."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);
		$sy += $h;
		$dx += $w;

		my $src = Image::Magick->new;
		$ret = $src->Read($file);
		warn "$ret\n" if $ret;
		$ret = $src->Crop(geometry=>$w."x".($h * 2)."+".$sx."+".$sy);
		warn "$ret\n" if $ret;
		$ret = $dst->Composite(
			image => $src,
			compose => 'Over',
			x => $dx,
			y => $dy
		);
		
		$ret = $dst->Transparent('#F700FF');
		warn "$ret\n" if $ret;

		my $outputPNG = "$CONFIG->{OUTPUT_DIR}/$config->{prefix}".$i.".png";
		$ret = $dst->Write("$outputPNG");
		warn "Write Failed $ret\n" if $ret;
	}

}

sub image_base {
	my $ret;
	my $config = [
		+{
			color => 'black',
			size => '192x96',
			width => 192,
			height => 96,
		},
		+{
			color => 'green',
			size => '48x48',
			width => 48,
			height => 48,
		},

		+{
			color => 'blue3',
			size => '48x48',
			width => 48,
			height => 48,
		},
		+{
			color => 'red3',
			size => '48x48',
			width => 48,
			height => 48,
		},
		+{
			color => 'white',
			size => '48x48',
			width => 48,
			height => 48,
		},
	];
	for my $conf (@{$config}) {
		my $outputPNG = "$conf->{color}.png";
		my $image = Image::Magick->new(size => $conf->{size});
		die unless $image;

		#$ret = $image->Set(size => '192x96');
		#warn "$ret\n" if $ret;
		$ret = $image->Read("xc:black");
		$ret = $image->Read("gradient: +level 0xAA%");
		$ret = $image->Draw(
			fill => $conf->{color}, 
			primitive => 'rectangle', 
			points => "0, 0 $conf->{width}, $conf->{height}"
		);
		warn "$ret\n" if $ret;

		my $opacity = 50;
		my $transparency = 1 - ($opacity / 100);
		$image->Evaluate(value=>$transparency, operator=>'Multiply', channel=>'Alpha');

		#$image->Set(alpha=>'Set');
		#$image->Set('virtual-pixel'=>'Transparent');
		#$image->Blur(geometry=>'192x96',channel=>'A');
		#$image->Level(levels=>'50%,100%',channel=>'A');

		#$ret = $image->Transparent($color);
		#warn "$ret\n" if $ret;
		$ret = $image->Write("$outputPNG");
		warn "Write Failed $ret\n" if $ret;
	}
}

# for item mark map
# convert bmp to png
# and set background color to be transparent
sub batch_convert {
	my ($dir) = @_;

	my $SRC_DIR = "./src";
	my $OUTPUT_DIR = "./output";

	my @files = `ls $SRC_DIR/$dir`;
	for my $file (@files) {
		chomp($file);
		if ($file =~ /(.*)\.(bmp|jpg|jpeg)/) {
			my $prefix = $1;
			my $newFileName = "$prefix.png";
			my $stmt = "convert -transparent '#F700FF' $SRC_DIR/$dir/$file $OUTPUT_DIR/$dir/$newFileName";
			print $stmt,"\n";
			`$stmt`;
		}
	}
}

#unit_atk($CONFIG->{UNIT_ATK});
#unit_mov($CONFIG->{UNIT_MOV});
#unit_spc($CONFIG->{UNIT_SPC});

image_base();

#batch_convert(@ARGV);

