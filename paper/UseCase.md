## Use Cases and Work Flow

We envision our system being useful for two types of use cases. The first is to
analyze the current vulnerabilities associated with all machines on a network.
This use case is to allow a system administrator to prioritize maintenance based
on the value of the machines and the criticality of the vulnerabilities found on
those machines using data from Nessus scans. The second use case is visualizing 
the changes to the vulnerability states of machines on a network after a system
administrator performs maintenance.


### Dynamic Vulnerability State Network

The first use case for our system is to make it easier for administrators to
visualize the state of all machines on a network before and after maintenance. 
The grouping functionality allows
the administrator to group together related machines by subnet, purpose of
functionality. In this example, virtual system machines are grouped into three
different categories. One group is a set of twenty-two workstations split
between ten Fedora workstations and twelve Ubuntu workstations. The second group is
a set of five servers that serve the Wordpress blogging software.  The last
grouping is a set of five Linux Apache PostgreSQL PHP (LAPP) servers.
Initially all of these groupings contain serious vulnerabilities.
The LAPP servers are running a poorly configured file transfer protocol (FTP) server
and both the LAPP and Wordpress servers have simple root passwords
which Nessus shows as a security hole. The majority of the workstations are properly configured
save for two that contain multiple security holes. Both of these workstations are
running outdated versions of the Ubuntu operating system and have
vulnerabilities such as an FTP server that allows a remote user to execute
arbitrary code, an incorrectly configured Windows file sharing software, weak secure shell
(SSH) keys and a Samba server that is vulnerable to buffer overflow attacks.

**Screen shot of group level (criticality) should go around here.**
![Alt Text](screenshots/final/SimGroupSingle.png)

While in the criticality visualization mode the administrator's attention is
drawn to the large LAPP server node. The size is an indication of the
importance of the situation based on the number of security holes discovered,
the severity of the security holes discovered, and the assigned criticality of
the machines in the group. When the administrator zooms into the LAPP Server
node of the treemap they see that all five of the machines seem to be equally
at risk. To gain further insight, the administrator zooms into the node for a
specific machine where each node represents a port with an associated
vulnerability. At this specific port node the administrator can click on a
vulnerability ID and the tool will display information about the vulnerability
and potential solutions in the right-most panel of the tool. In this situation the LAPP servers all have the same
weak root password security hole. The system administrator will also find that
the Wordpress servers suffer from the same weak password vulnerability as the
LAPP servers.

**Screenshot of zoomed in tree map can go here.**
![Alt Text](screenshots/final/LAPPServerSimPort.png)

When the administrator zooms back out to the
group view and switches the visualization to severity mode, the workstation's
node grows bringing it into greater prominence. When the administrator
zooms into the workstation group they can see that two IP addresses have much
larger and darker nodes than any of the other workstations. If they zoom into
one of these IP addresses, they see that the most severe of the vulnerabilities
are associated with ports 445 and 80. The administrator can examine each port
node's child, seeing information about the specific vulnerabilities in the right-most
panel, discovering that the machine is running a poorly configured Apache
Web Server and that a Windows share that can be accessed through the network.

After further exploring their network, the administrator patches the most critical
vulnerabilities in the system. The Nessus Vulnerability Visualization system
provides functionality to compare two nbe files to show changes between two
vulnerability states, such as before and after applying patches. After patching
their system the administrator can rescan the network, then explore and see the
differences between the previous state and the newly patched system.
The Nessus Visualization System shows corrected
vulnerabilities in green, the remaining vulnerabilities in orange, and any new
vulnerabilities in pink. The system administrator can easily see that the
major workstations vulnerabilities have been patched. Zooming into the
workstation node the system administrator sees that while they were patching the most
severe vulnerabilities they inadvertently opened new vulnerabilities on the two
machines and did not address some of the vulnerabilities seen earlier.

**Screenshot of diff treemap.**
![Alt Text](screenshots/final/SimDiffGroup.png)

We simulated this use case using virtual machines (VM) communicating through a host-only
network. Using a host-only network allowed us to use Nessus from the host
to scan the VMs. We used one grouping of two different types of work station
and two groupings of similar servers. Both groups of servers were using Ubuntu 10.10 LTS.
Ten of the Ubuntu workstations were using Ubuntu 11.10 while the two workstations
with the massive number of vulnerabilities were using Ubuntu 8.04 with
purposely unpatched and misconfigured software.
The Fedora workstations were running Fedora 15.  We used the Metasploitable
virtual machine image to simulate the two vulnerable workstations before they
were upgraded to 11.10.

In this use case we did not patch all security notes that Nessus mentioned
because this would not be realistic for an actual system administrator. Instead,
the system administrator would only handle the most important vulnerabilities and
system updates. In this simulated use case we improved the weak root passwords
and corrected the poorly configured FTP server seen on the servers. We focused on updating
and correcting the two most vulnerable workstations by updating them to be the
same as the other ten Ubuntu workstations.

### Static Vulnerability State Network

To test visualizing a large static vulnerability state we use Nessus scan data from
the VAST Challenge 2011 (TODO cite). This data is from a simulated network for the
fictitious All Freight Corporation. The VAST Challenge gives us a large network
dataset to test how the Nessus Vulnerability Visualization scales to a large
data set that contains many vulnerabilities spread across a variety of machines and
groups. This data set has more than one
hundred-fifty unique IP addresses associated with various workstations in the
scan. The Nessus scan shows that numerous
machines on the network have some sort of security hole such as incorrectly
configured telnet client, a font driver that allows privilege escalation, and a
vulnerability in an outdated version of Microsoft Excel. The All Freight
Corporation has other machines and servers but they were not included in the
Nessus scan data.

** Screenshot of over all **
![Alt Text](screenshots/final/VastGroup.png)

We split the workstations into six groups with criticalities ranging from two to
nine.  The major security holes in the group are concentrated in group four with a
criticality of nine and in group five with a criticality of two.  When the
system administrator looks at the groups level on the tree map it is immediately
obvious where their attention is needed most. Groups four and five dominate the
treemap in all three visualization modes. When the system administrator zooms
into group four, they see that most of the vulnerabilities are located on two IP
addresses. When they select IP address 192.168.2.172, they see that nearly all of
the vulnerabilities are associated with port 445 and a Windows file sharing
program. The system administrator can also explore the other dominate IP address 192.168.2.171 and
see that this machines vulnerabilities come from port 139 and NetBIOS. The
Nessus Vulnerability Visualization system makes the most critical and most
severe vulnerabilities most prominent in the visualization. This
exploration allows the system administrator to easily discover vulnerabilities
in the system and prioritize repair accordingly. It also makes it easier to view large
networks because the IP addresses are aggregated into nodes that can be expanded to view
the individual IP addresses contained in that group.


** Screen Shot of a zoomed in node **
![Alt Text](screenshots/final/VASTWorkstationPort.png)
