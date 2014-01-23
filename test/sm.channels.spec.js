describe('sm.channels', function() {

	describe('message types', function() {
        it('should allow comparing instanceof AsyncResult from modules outside of core', function() {
			var channel = new smallmachine.behavior.Channel();
            var test = new smallmachine.type.AsyncResult(channel);
            expect(test instanceof smallmachine.type.AsyncResult).toBe(true);
        });
	});

	describe('publish politics', function() {
		it ('should not notify a delegate if a subscriber claims authority', function() {
			var value = false;
			target.user.action.subscribe(function(message) { return { update : function(message){ value = message; } } });
			target.user.action.subscribe(function(message) { return true; });
			target.user.action.publish(true);
			expect(value).toBe(false);
			delete target.user.action._subscribers;
		});
	});

	describe('publishing to concepts', function() {
		it('should notify user.action if user is published to', function() {
			var value = false;
			target.user.action.subscribe({ update : function(message){ value = message; } });
			target.user.publish(true);
			expect(value).toBe(true);
			delete target.user.action._subscribers;
		});
	});

    describe('publishing to relationships', function() {
        it('should notify subscribers to user.performs when any action is published to', function() {
            var notified = null;
            target.user.performs.subscribe({ update : function(result) { notified = result; }, cancel : function(result) { } }); 
            target.action.publish(function(){ return 123; });
            expect(notified).toBe(123);
			delete target.user.performs._subscribers;
        });

        it('should not notify subscribers to user.performs when any task is published to', function() {
            var notified = 0;
            target.user.performs.subscribe({update:function(r){notified++;},cancel:function(r){}});
            target.system.get.publish(function(){return 123;});
            expect(notified).toBe(0);
			delete target.user.performs._subscribers;
        });

        it('should notify subscribers to system.reactsTo when any action is published to', function() {
            var notified = null;
            target.system.reactsTo.subscribe({
                update : function(result) {
                    notified = result;
                },
                cancel : function(result) {
                }
            });
            target.action.publish(function(){ return 123; });
            expect(notified).toBe(123);
			delete target.system.reactsTo._subscribers;
        });

        it('should notify subscribers to target.performs when any action or task is published to', function() {
            var notified = 0;
            target.performs.subscribe({ update : function(result) { notified++; }, cancel : function(result) { } });
            target.user.action.publish(function(){ return 123; });
            target.system.get.publish(function(){ return 123; });
            expect(notified).toBe(2);
			delete target.performs._subscribers;
        });
    });

	describe('backchannels', function() {
		it ('should allow adding a backchannel to a channel', function() {
			target.system.backchannel(target.all);
			expect(target.system._backchannels.length).toBe(1);
			delete target.system._backchannels;
		});

		it('should notify a backchannel when the channel is notified', function() {
			var notified = false;
			target.system.backchannel(target.all);
			target.all.subscribe(function(notification) {
				notified = notification.message;
			});
			target.system.publish(true);
			expect(notified).toBe(true);
			delete target.all._subscribers;
			delete target.system._backchannels;
		});

		it('should include the channel value to a backchannel when the channel is notified', function() {
			var notified = false;
			target.system.backchannel(target.all);
			target.all.subscribe(function(notification) {
				notified = notification.value;
			});
			target.system.publish(true);
			expect(notified).toBe('system');
			delete target.all._subscribers;
			delete target.system._backchannels;
		});

		it('should include the channel id to a backchannel when the channel is notified', function() {
			var notified;
			target.system.backchannel(target.all);
			target.all.subscribe(function(notification) {
				notified = notification.id;
			});
			target.system.publish(true);
			expect(notified).toBeDefined();
			delete target.all._subscribers;
			delete target.system._backchannels;
		});
	});

	describe('subscriptions', function() {
		it('should add a NamedValueCollection to a model', function() {
			expect(target.memory).toBeDefined();
		});

		it('should add named values to memory when calling set', function() {
			var actual = new smallmachine.type.NamedValue('test', '123', true);
			target.set.publish(actual);
			expect(target.memory._collection.test).toBeDefined();
			expect(target.memory._collection.test['123']).toBeDefined();
		});

		it('should be able to check for the existence of a named value after calling set', function() {
			var actual = new smallmachine.type.NamedValue('test2', '1234', true);
			target.set.publish(actual);
			expect(target.memory.exists('test2', '1234')).toBe(true);
		});

		it('should update a NamedValue when publishing to get', function() {
			var actual = new smallmachine.type.NamedValue('test3', 'a', true);
			target.set.publish(actual);
			expect(target.memory.exists('test3', 'a')).toBe(true);
			var testData = new smallmachine.type.NamedValue('test3', 'a', false);
			target.get.publish(testData);
			expect(testData.value).toBe(true);
		});

		it('should use default value of a NamedValue when publishing to get', function() {
			var actual = new smallmachine.type.NamedValue('test4', 'a', true);
			target.set.publish(actual);
			expect(target.memory.exists('test4', 'a')).toBe(true);
			var testData = new smallmachine.type.NamedValue('test4', 'b', false);
			target.get.publish(testData);
			expect(testData.value).toBe(false);
		});

		it('should remove subscribers when calling unsubscribe', function() {
			var actual = target.system.initialize.subscribe(function(message){});	
			expect(target.system.initialize._subscribers[actual]).toBeDefined();
			target.system.initialize.unsubscribe(actual);
			expect(target.system.initialize._subscribers[actual]).not.toBeDefined();
		});

		it('should remove subscribers when their lifetime reaches 0', function() {
			var actual = target.system.initialize.subscribe({
				update : function(message){
					this.lifetime = 0;
				}
			});	
			expect(target.system.initialize._subscribers[actual]).toBeDefined();
			target.system.initialize.publish('test');
			expect(target.system.initialize._subscribers[actual]).not.toBeDefined();
		});

		it('should subscribe #test1 and #test2 using the jQuery extension', function() {
			var hit1 = false, hit2 = false;
			jQuery('#test1').subscribe(target.system, function(message) { hit1 = this.id; });
			jQuery('#test2').subscribe(target.system, function(message) { hit2 = this.id; });
			target.system.publish(true);
			expect(hit1).toBe('test1');
			expect(hit2).toBe('test2');
		});

		it('should have access to the subscribing method when using jQuery extension', function() {
			var hit = false;
			jQuery('#test3').subscribe(target.initialize, function(message) { hit = this.subscriber; });
			target.initialize.publish(true);
			expect(hit).not.toBe(false);
		});

		it('setting lifetime to 0 inside a subscriber while using the jQuery extension should unsubscribe it', function() {
			expect(target.remove._subscribers).not.toBeDefined();
			jQuery('#test4').subscribe(target.remove, function(message) { this.subscriber.lifetime = 0; });
			expect(target.remove._subscribers).toBeDefined();
			var counterA = 0;
			for (var s in target.remove._subscribers) counterA++;
			expect(counterA).toBe(1);
			target.remove.publish(true);
			var counterB = 0;
			for (var s in target.remove._subscribers) counterB++;
			expect(counterB).toBe(0);
		});
	});
});
