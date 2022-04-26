import React, { useEffect } from 'react';
import { useFilters, useSortBy, useTable } from 'react-table';
import BTable from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { loadUsers, setUserGroup } from '../../actions/users';
import { loadGroups } from '../../actions/groups';
import { dateTime, single } from '../../utils/dateFormats';
import { DefaultColumnFilter, SelectColumnFilter } from '../../utils/react-tableFilters';

const UserTable = ({ loadUsers, loadGroups, setUserGroup, users, groups, userLoading, groupsLoading }) => {
	const GroupButton = (cell) => {
		return (
			<Button
				className="groupButton"
				variant={
					cell.row.original.groups.filter((g) => {
						return g.name === cell.column.id;
					}).length !== 0
						? 'success'
						: 'danger'
				}
				value={cell.value}
				onClick={() =>
					setUserGroup({
						userId: cell.row.original._id,
						groupName: cell.column.id,
						setMember:
							cell.row.original.groups.filter((g) => {
								return g.name === cell.column.id;
							}).length === 0,
					})
				}
			>
				{cell.value}
			</Button>
		);
	};
	//console.log(users);

	const columnsArray = [
		{
			Header: 'Namn',
			accessor: 'name',
		},
		{
			Header: 'Email',
			accessor: 'email',
		},
		{
			id: 'activated',
			Header: 'Aktiverad',
			accessor: (d) => (d.activated ? 'Aktiverad' : 'Ej aktiverad'),
			Filter: SelectColumnFilter,
			filter: 'includes',
		},
		{
			id: 'createdAt',
			Header: 'Skapad',
			accessor: (d) => {
				return single(d.createdAt);
			},
			disableFilters: true,
		},
		{
			id: 'lastLogin',
			Header: 'Senast inloggad',
			accessor: (d) => {
				return dateTime(d.lastLogin);
			},
			disableFilters: true,
		},
	];

	useEffect(() => {
		async function getUsers() {
			await loadUsers();
		}
		getUsers();
		async function getGroups() {
			await loadGroups();
		}
		getGroups();
	}, [loadUsers, loadGroups]);

	const data = React.useMemo(() => users, [users]);

	const columns = React.useMemo(
		() =>
			columnsArray.concat(
				groups.map((group) => {
					return {
						Header: group.name,
						accessor: (d) => {
							return d.hasOwnProperty(group._id) ? 'Medlem' : 'Ej medlem';
						},
						Cell: ({ cell }) => {
							return GroupButton(cell);
						},
						Filter: SelectColumnFilter,
						filter: 'includes',
					};
				})
			),
		[groups]
	);

	const defaultColumn = React.useMemo(
		() => ({
			Filter: DefaultColumnFilter,
		}),
		[]
	);

	const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
		{ columns, data, defaultColumn },
		useFilters,
		useSortBy
	);

	return (
		<BTable {...getTableProps()} className="userTable" bg="dark" variant="dark">
			<thead>
				{headerGroups.map((headerGroup) => (
					<tr {...headerGroup.getHeaderGroupProps()}>
						{headerGroup.headers.map((column) => (
							<th {...column.getHeaderProps()}>
								<div {...column.getHeaderProps(column.getSortByToggleProps())}>
									{column.render('Header')}
									<span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
								</div>
								<div className="userTableFilter">{column.canFilter ? column.render('Filter') : null}</div>
							</th>
						))}
					</tr>
				))}
			</thead>
			<tbody {...getTableBodyProps()}>
				{rows.map((row) => {
					prepareRow(row);
					return (
						<tr {...row.getRowProps()}>
							{row.cells.map((cell) => {
								return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
							})}
						</tr>
					);
				})}
			</tbody>
		</BTable>
	);
};

UserTable.propTypes = {
	loadUsers: PropTypes.func.isRequired,
	loadGroups: PropTypes.func.isRequired,
	setUserGroup: PropTypes.func.isRequired,
	users: PropTypes.array.isRequired,
	groups: PropTypes.array.isRequired,
	usersLoading: PropTypes.bool.isRequired,
	groupsLoading: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => {
	//console.log(state.users);
	return {
		users: state.users.users,
		groups: state.groups.groups,
		usersLoading: state.users.loading,
		groupsLoading: state.groups.loading,
	};
};

export default connect(mapStateToProps, { loadUsers, loadGroups, setUserGroup })(UserTable);
