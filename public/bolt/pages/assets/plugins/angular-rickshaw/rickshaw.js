/**
 @toc

 @param {Object} scope (attrs that must be defined on the scope (i.e. in the controller) - they can't just be defined in the partial html). REMEMBER: use snake-case when setting these on the partial!
 TODO

 @param {Object} attrs REMEMBER: use snake-case when setting these on the partial! i.e. my-attr='1' NOT myAttr='1'
 TODO

 @dependencies
 TODO

 @usage
 partial / html:
 TODO

 controller / js:
 TODO

 //end: usage
 */

'use strict';

/* global Rickshaw */

angular.module('angular-rickshaw', [])
        .directive('rickshaw', function($compile) {
            return {
                restrict: 'EA',
                scope: {
                    options: '=rickshawOptions',
                    series: '=rickshawSeries',
                    features: '=rickshawFeatures'
                },
                // replace: true,
                link: function(scope, element, attrs) {
					var graphEl;
                    var graph;
					var settings;

                    function update() {
						if (!graph) {
							var mainEl = angular.element(element);
							mainEl.append(graphEl);
							mainEl.empty();
							graphEl = $compile('<div></div>')(scope);
							mainEl.append(graphEl);

							settings = angular.copy(scope.options);
							settings.element = graphEl[0];
							settings.series = scope.series;

							graph = new Rickshaw.Graph(settings);
						}
						else {
							settings = angular.copy(scope.options, settings);
							settings.element = graphEl[0];
							settings.series = scope.series;

							graph.configure(settings);
						}

                        if (scope.features && scope.features.hover) {
                            var hoverConfig = {
                                graph: graph
                            };
                            hoverConfig.xFormatter = scope.features.hover.xFormatter;
                            hoverConfig.yFormatter = scope.features.hover.yFormatter;
                            hoverConfig.formatter = scope.features.hover.formatter;
                            var hoverDetail = new Rickshaw.Graph.HoverDetail(hoverConfig);
                        }
                        if (scope.features && scope.features.palette) {
                            var palette = new Rickshaw.Color.Palette({scheme: scope.features.palette});
                            for (var i = 0; i < settings.series.length; i++) {
                                settings.series[i].color = palette.color();
                            }
                        }

                        graph.render();

                        if (scope.features && scope.features.xAxis) {
                            var xAxisConfig = {
                                graph: graph
                            };
                            if (scope.features.xAxis.timeUnit) {
                                var time = new Rickshaw.Fixtures.Time();
                                xAxisConfig.timeUnit = time.unit(scope.features.xAxis.timeUnit);
                            } 
                            if(scope.features.xAxis.timeFixture){
                                xAxisConfig.timeFixture = new Rickshaw.Fixtures.Time();
                            }
                            var xAxis = new Rickshaw.Graph.Axis.Time(xAxisConfig);
                            xAxis.render();
                        }
                        if (scope.features && scope.features.yAxis) {
                            var yAxisConfig = {
                                graph: graph
                            };
                            if(scope.features.yAxis.element){
                                yAxisConfig.element = mainEl.parent().find(scope.features.yAxis.element)[0];
                            }
                            if (scope.features.yAxis.tickFormat) {
                                yAxisConfig.tickFormat = Rickshaw.Fixtures.Number[scope.features.yAxis.tickFormat];
                            }

                            var yAxis = new Rickshaw.Graph.Axis.Y(yAxisConfig);
                            yAxis.render();
                        }
                        if(scope.features && scope.features.slider){
                             var sliderConfig = {
                                graph: graph,
                                height: scope.features.slider.height || 100,
                                element: mainEl.parent().find(scope.features.slider.element)[0]
                             };
                             var slider = new Rickshaw.Graph.RangeSlider.Preview(sliderConfig);
                        }
                        if (scope.features && scope.features.legend) {
                            var legendEl = $compile('<div></div>')(scope);
                            mainEl.append(legendEl);

                            var legend = new Rickshaw.Graph.Legend({
                                graph: graph,
                                element: legendEl[0]
                            });
                            if (scope.features.legend.toggle) {
                                var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
                                    graph: graph,
                                    legend: legend
                                });
                            }
                            if (scope.features.legend.highlight) {
                                var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
                                    graph: graph,
                                    legend: legend
                                });
                            }
                        }
                    }

                    var optionsWatch = scope.$watch('options', function(newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            update();
                        }
                    }, true);
                    var seriesWatch = scope.$watch(function(scope) {
						if (scope.features && scope.features.directive && scope.features.directive.watchAllSeries) {
							var watches = {};
							for (var i = 0; i < scope.series.length; i++) {
								watches['series' + i] = scope.series[i].data;
							}
							return watches;
						}
						else {
							return scope.series[0].data;
						}
                    }, function(newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            update();
                        }
                    }, true);
                    var featuresWatch = scope.$watch('features', function(newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            update();
                        }
                    }, true);

					scope.$on('$destroy', function() {
						optionsWatch();
						seriesWatch();
						featuresWatch();
					});
					
                    update();
                },
                controller: function($scope, $element, $attrs) {
                }
            };
        });
