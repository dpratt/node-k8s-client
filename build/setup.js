import gulp from 'gulp';
import gulpHelp from 'gulp-help';
import gulpLoadPlugins from 'gulp-load-plugins';

gulpHelp(gulp);

gulp.plugins = gulpLoadPlugins(gulp);
