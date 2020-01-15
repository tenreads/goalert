import React, { useState } from 'react'
import { PropTypes as p } from 'prop-types'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { Card, Tooltip } from '@material-ui/core'
import FlatList from '../lists/FlatList'
import OtherActions from '../util/OtherActions'
import CreateFAB from '../lists/CreateFAB'
import CalendarSubscribeCreateDialog from '../schedules/calendar-subscribe/CalendarSubscribeCreateDialog'
import { Warning } from '../icons'
import CalendarSubscribeDeleteDialog from '../schedules/calendar-subscribe/CalendarSubscribeDeleteDialog'
import CalendarSubscribeEditDialog from '../schedules/calendar-subscribe/CalendarSubscribeEditDialog'
import { GenericError, ObjectNotFound } from '../error-pages'
import _ from 'lodash-es'
import Spinner from '../loading/components/Spinner'
import { formatTimeSince } from '../util/timeFormat'

export const calendarSubscriptionsQuery = gql`
  query calendarSubscriptions($id: ID!) {
    user(id: $id) {
      id
      calendarSubscriptions {
        id
        name
        reminderMinutes
        scheduleID
        schedule {
          name
        }
        lastAccess
        disabled
      }
    }
  }
`

export default function UserCalendarSubscriptionList(props) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialogByID, setShowEditDialogByID] = useState(null)
  const [showDeleteDialogByID, setShowDeleteDialogByID] = useState(null)

  const { data, loading, error } = useQuery(calendarSubscriptionsQuery, {
    variables: {
      id: props.userID,
    },
  })

  if (error) return <GenericError error={error.message} />
  if (!_.get(data, 'user.id')) return loading ? <Spinner /> : <ObjectNotFound />

  const subs = data.user.calendarSubscriptions.sort((a, b) => {
    if (a.schedule.name < b.schedule.name) return -1
    if (a.schedule.name > b.schedule.name) return 1

    if (a.name > b.name) return 1
    if (a.name < b.name) return -1
  })

  const subheaderDict = {}
  const items = []

  subs.forEach(sub => {
    if (!subheaderDict[sub.schedule.name]) {
      subheaderDict[sub.schedule.name] = true
      items.push({ subHeader: sub.schedule.name })
    }

    items.push({
      title: sub.name,
      subText: 'Last sync: ' + (formatTimeSince(sub.lastAccess) || 'Never'),
      secondaryAction: renderOtherActions(sub.id),
      icon: sub.disabled ? (
        <Tooltip title='Disabled'>
          <Warning />
        </Tooltip>
      ) : null,
    })
  })

  // todo: check if current user here and don't render if not their profile
  function renderOtherActions(id) {
    return (
      <OtherActions
        actions={[
          {
            label: 'Edit',
            onClick: () => setShowEditDialogByID(id),
          },
          {
            label: 'Delete',
            onClick: () => setShowDeleteDialogByID(id),
          },
        ]}
      />
    )
  }

  return (
    <React.Fragment>
      <Card>
        <FlatList
          headerNote='Showing your current on-call subscriptions for all schedules'
          emptyMessage='Your are not subscribed to any schedules'
          items={items}
        />
      </Card>
      <CreateFAB
        title='Create Subscription'
        onClick={() => setShowCreateDialog(true)}
      />
      {showCreateDialog && (
        <CalendarSubscribeCreateDialog
          onClose={() => setShowCreateDialog(false)}
        />
      )}
      {showEditDialogByID && (
        <CalendarSubscribeEditDialog
          calSubscriptionID={showEditDialogByID}
          onClose={() => setShowEditDialogByID(null)}
        />
      )}
      {showDeleteDialogByID && (
        <CalendarSubscribeDeleteDialog
          calSubscriptionID={showDeleteDialogByID}
          onClose={() => setShowDeleteDialogByID(null)}
        />
      )}
    </React.Fragment>
  )
}

UserCalendarSubscriptionList.propTypes = {
  userID: p.string.isRequired,
}