/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global document */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import { _clear as clearTranslations, add as addTranslations } from '@ckeditor/ckeditor5-utils/src/translation-service';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

import TableEditing from '../src/tableediting';
import TableUI from '../src/tableui';
import SwitchButtonView from '@ckeditor/ckeditor5-ui/src/button/switchbuttonview';
import DropdownView from '@ckeditor/ckeditor5-ui/src/dropdown/dropdownview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';

describe( 'TableUI', () => {
	let editor, element;

	testUtils.createSinonSandbox();

	before( () => {
		addTranslations( 'en', {} );
		addTranslations( 'pl', {} );
	} );

	after( () => {
		clearTranslations();
	} );

	beforeEach( () => {
		element = document.createElement( 'div' );
		document.body.appendChild( element );

		return ClassicTestEditor
			.create( element, {
				plugins: [ TableEditing, TableUI ]
			} )
			.then( newEditor => {
				editor = newEditor;
			} );
	} );

	afterEach( () => {
		element.remove();

		return editor.destroy();
	} );

	describe( 'insertTable dropdown', () => {
		let insertTable;

		beforeEach( () => {
			insertTable = editor.ui.componentFactory.create( 'insertTable' );
		} );

		it( 'should register insertTable button', () => {
			expect( insertTable ).to.be.instanceOf( DropdownView );
			expect( insertTable.buttonView.label ).to.equal( 'Insert table' );
			expect( insertTable.buttonView.icon ).to.match( /<svg / );
		} );

		it( 'should bind to insertTable command', () => {
			const command = editor.commands.get( 'insertTable' );

			command.isEnabled = true;
			expect( insertTable.buttonView.isOn ).to.be.false;
			expect( insertTable.buttonView.isEnabled ).to.be.true;

			command.isEnabled = false;
			expect( insertTable.buttonView.isEnabled ).to.be.false;
		} );

		it( 'should execute insertTable command on button execute event', () => {
			const executeSpy = testUtils.sinon.spy( editor, 'execute' );

			const tableSizeView = insertTable.panelView.children.first;

			tableSizeView.rows = 2;
			tableSizeView.columns = 7;

			insertTable.fire( 'execute' );

			sinon.assert.calledOnce( executeSpy );
			sinon.assert.calledWithExactly( executeSpy, 'insertTable', { rows: 2, columns: 7 } );
		} );

		it( 'should reset rows & columns on dropdown open', () => {
			const tableSizeView = insertTable.panelView.children.first;

			expect( tableSizeView.rows ).to.equal( 0 );
			expect( tableSizeView.columns ).to.equal( 0 );

			tableSizeView.rows = 2;
			tableSizeView.columns = 2;

			insertTable.buttonView.fire( 'open' );

			expect( tableSizeView.rows ).to.equal( 0 );
			expect( tableSizeView.columns ).to.equal( 0 );
		} );
	} );

	describe( 'tableRow dropdown', () => {
		let dropdown;

		beforeEach( () => {
			dropdown = editor.ui.componentFactory.create( 'tableRow' );
		} );

		it( 'have button with proper properties set', () => {
			expect( dropdown ).to.be.instanceOf( DropdownView );

			const button = dropdown.buttonView;

			expect( button.isOn ).to.be.false;
			expect( button.tooltip ).to.be.true;
			expect( button.label ).to.equal( 'Row' );
			expect( button.icon ).to.match( /<svg / );
		} );

		it( 'should have proper items in panel', () => {
			const listView = dropdown.listView;

			const labels = listView.items.map( item => item instanceof ListSeparatorView ? '|' : item.children.first.label );

			expect( labels ).to.deep.equal( [ 'Header row', '|', 'Insert row below', 'Insert row above', 'Delete row' ] );
		} );

		it( 'should bind items in panel to proper commands', () => {
			const items = dropdown.listView.items;

			const setRowHeaderCommand = editor.commands.get( 'setTableRowHeader' );
			const insertRowBelowCommand = editor.commands.get( 'insertTableRowBelow' );
			const insertRowAboveCommand = editor.commands.get( 'insertTableRowAbove' );
			const removeRowCommand = editor.commands.get( 'removeTableRow' );

			setRowHeaderCommand.isEnabled = true;
			insertRowBelowCommand.isEnabled = true;
			insertRowAboveCommand.isEnabled = true;
			removeRowCommand.isEnabled = true;

			expect( items.first.children.first.isEnabled ).to.be.true;
			expect( items.get( 2 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 4 ).children.first.isEnabled ).to.be.true;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			setRowHeaderCommand.isEnabled = false;

			expect( items.first.children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			insertRowBelowCommand.isEnabled = false;

			expect( items.get( 2 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			insertRowAboveCommand.isEnabled = false;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			removeRowCommand.isEnabled = false;

			expect( items.get( 4 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.false;
		} );

		it( 'should focus view after command execution', () => {
			const focusSpy = testUtils.sinon.spy( editor.editing.view, 'focus' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			sinon.assert.calledOnce( focusSpy );
		} );

		it( 'executes command when it\'s executed', () => {
			const spy = sinon.stub( editor, 'execute' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			expect( spy.calledOnce ).to.be.true;
			expect( spy.args[ 0 ][ 0 ] ).to.equal( 'setTableRowHeader' );
		} );

		it( 'should use a toggle switch for the setTableRowHeader item', () => {
			const items = dropdown.listView.items;

			expect( items.first.children.first ).to.be.instanceOf( SwitchButtonView );
		} );

		it( 'should bind set header row command value to dropdown item', () => {
			const items = dropdown.listView.items;

			const setRowHeaderCommand = editor.commands.get( 'setTableRowHeader' );

			setRowHeaderCommand.value = false;
			expect( items.first.children.first.isOn ).to.be.false;

			setRowHeaderCommand.value = true;
			expect( items.first.children.first.isOn ).to.be.true;
		} );
	} );

	describe( 'tableColumn dropdown', () => {
		let dropdown;

		beforeEach( () => {
			dropdown = editor.ui.componentFactory.create( 'tableColumn' );
		} );

		it( 'have button with proper properties set', () => {
			expect( dropdown ).to.be.instanceOf( DropdownView );

			const button = dropdown.buttonView;

			expect( button.isOn ).to.be.false;
			expect( button.tooltip ).to.be.true;
			expect( button.label ).to.equal( 'Column' );
			expect( button.icon ).to.match( /<svg / );
		} );

		it( 'should have proper items in panel', () => {
			const listView = dropdown.listView;

			const labels = listView.items.map( item => item instanceof ListSeparatorView ? '|' : item.children.first.label );

			expect( labels ).to.deep.equal( [ 'Header column', '|', 'Insert column left', 'Insert column right', 'Delete column' ] );
		} );

		it( 'should bind items in panel to proper commands', () => {
			const items = dropdown.listView.items;

			const setColumnHeaderCommand = editor.commands.get( 'setTableColumnHeader' );
			const insertColumnLeftCommand = editor.commands.get( 'insertTableColumnLeft' );
			const insertColumnRightCommand = editor.commands.get( 'insertTableColumnRight' );
			const removeColumnCommand = editor.commands.get( 'removeTableColumn' );

			setColumnHeaderCommand.isEnabled = true;
			insertColumnLeftCommand.isEnabled = true;
			insertColumnRightCommand.isEnabled = true;
			removeColumnCommand.isEnabled = true;

			expect( items.first.children.first.isEnabled ).to.be.true;
			expect( items.get( 2 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 4 ).children.first.isEnabled ).to.be.true;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			setColumnHeaderCommand.isEnabled = false;

			expect( items.first.children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			insertColumnLeftCommand.isEnabled = false;

			expect( items.get( 2 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			insertColumnRightCommand.isEnabled = false;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.false;

			removeColumnCommand.isEnabled = false;
			expect( items.get( 4 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.false;
		} );

		it( 'should focus view after command execution', () => {
			const focusSpy = testUtils.sinon.spy( editor.editing.view, 'focus' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			sinon.assert.calledOnce( focusSpy );
		} );

		it( 'executes command when it\'s executed', () => {
			const spy = sinon.stub( editor, 'execute' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			expect( spy.calledOnce ).to.be.true;
			expect( spy.args[ 0 ][ 0 ] ).to.equal( 'setTableColumnHeader' );
		} );

		it( 'should use a toggle switch for the setTableColumnHeader item', () => {
			const items = dropdown.listView.items;

			expect( items.first.children.first ).to.be.instanceOf( SwitchButtonView );
		} );

		it( 'should bind set header column command value to dropdown item', () => {
			const items = dropdown.listView.items;

			const setColumnHeaderCommand = editor.commands.get( 'setTableColumnHeader' );

			setColumnHeaderCommand.value = false;
			expect( items.first.children.first.isOn ).to.be.false;

			setColumnHeaderCommand.value = true;
			expect( items.first.children.first.isOn ).to.be.true;
		} );
	} );

	describe( 'mergeTableCell dropdown', () => {
		let dropdown;

		beforeEach( () => {
			dropdown = editor.ui.componentFactory.create( 'mergeTableCells' );
		} );

		it( 'have button with proper properties set', () => {
			expect( dropdown ).to.be.instanceOf( DropdownView );

			const button = dropdown.buttonView;

			expect( button.isOn ).to.be.false;
			expect( button.tooltip ).to.be.true;
			expect( button.label ).to.equal( 'Merge cells' );
			expect( button.icon ).to.match( /<svg / );
		} );

		it( 'should have proper items in panel', () => {
			const listView = dropdown.listView;

			const labels = listView.items.map( item => item instanceof ListSeparatorView ? '|' : item.children.first.label );

			expect( labels ).to.deep.equal( [
				'Merge cell up',
				'Merge cell right',
				'Merge cell down',
				'Merge cell left',
				'|',
				'Split cell vertically',
				'Split cell horizontally'
			] );
		} );

		it( 'should bind items in panel to proper commands', () => {
			const items = dropdown.listView.items;

			const mergeCellUpCommand = editor.commands.get( 'mergeTableCellUp' );
			const mergeCellRightCommand = editor.commands.get( 'mergeTableCellRight' );
			const mergeCellDownCommand = editor.commands.get( 'mergeTableCellDown' );
			const mergeCellLeftCommand = editor.commands.get( 'mergeTableCellLeft' );
			const splitCellVerticallyCommand = editor.commands.get( 'splitTableCellVertically' );
			const splitCellHorizontallyCommand = editor.commands.get( 'splitTableCellHorizontally' );

			mergeCellUpCommand.isEnabled = true;
			mergeCellRightCommand.isEnabled = true;
			mergeCellDownCommand.isEnabled = true;
			mergeCellLeftCommand.isEnabled = true;
			splitCellVerticallyCommand.isEnabled = true;
			splitCellHorizontallyCommand.isEnabled = true;

			expect( items.first.children.first.isEnabled ).to.be.true;
			expect( items.get( 1 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 2 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 5 ).children.first.isEnabled ).to.be.true;
			expect( items.get( 6 ).children.first.isEnabled ).to.be.true;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			mergeCellUpCommand.isEnabled = false;

			expect( items.first.children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			mergeCellRightCommand.isEnabled = false;

			expect( items.get( 1 ).children.first.isEnabled ).to.be.false;
			expect( dropdown.buttonView.isEnabled ).to.be.true;

			mergeCellDownCommand.isEnabled = false;
			expect( items.get( 2 ).children.first.isEnabled ).to.be.false;

			mergeCellLeftCommand.isEnabled = false;
			expect( items.get( 3 ).children.first.isEnabled ).to.be.false;

			splitCellVerticallyCommand.isEnabled = false;
			expect( items.get( 5 ).children.first.isEnabled ).to.be.false;

			splitCellHorizontallyCommand.isEnabled = false;
			expect( items.get( 6 ).children.first.isEnabled ).to.be.false;

			expect( dropdown.buttonView.isEnabled ).to.be.false;
		} );

		it( 'should focus view after command execution', () => {
			const focusSpy = testUtils.sinon.spy( editor.editing.view, 'focus' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			sinon.assert.calledOnce( focusSpy );
		} );

		it( 'executes command when it\'s executed', () => {
			const spy = sinon.stub( editor, 'execute' );

			dropdown.listView.items.first.children.first.fire( 'execute' );

			expect( spy.calledOnce ).to.be.true;
			expect( spy.args[ 0 ][ 0 ] ).to.equal( 'mergeTableCellUp' );
		} );
	} );
} );
